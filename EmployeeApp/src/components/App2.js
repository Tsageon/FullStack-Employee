import React, { useState, useRef, useEffect } from "react";
import { storage, db } from "../Config/firebase";
import {
  collection,
 
  addDoc,

  doc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import axios from "axios";
import "./app2.css";

function Form() {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [id, setId] = useState('')
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    gender: "",
    email: "",
    phone: "",
    image: null,
    position: "",
    id: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState("");
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("form");
  const searchTimeoutRef = useRef(null);

  const validate = () => {
    let tempErrors = {};
    tempErrors.name = newEmployee.name ? "" : "This field is required.";
    tempErrors.gender = newEmployee.gender ? "" : "What's Your Gender?";
    tempErrors.email = newEmployee.email
      ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmployee.email)
        ? ""
        : "Are you a Robot?"
      : "This field is required.";
    tempErrors.phone = newEmployee.phone
      ? /^\d{10}$/.test(newEmployee.phone)
        ? ""
        : "How will we contact you?"
      : "This field is required.";
    tempErrors.image = newEmployee.image ? "" : "Profile Picture is required.";
    tempErrors.position = newEmployee.position ? "" : "Position is required.";
    tempErrors.id = newEmployee.id
      ? /^\d{13}$/.test(newEmployee.id)
        ? ""
        : "This needs to be 13 digits."
      : "This field is required.";
    setErrors(tempErrors);
    return Object.values(tempErrors).every((x) => x === "");
  };

  const resetForm = () => {
    setNewEmployee({
      name: "",
      gender: "",
      email: "",
      phone: "",
      image: "",
      position: "",
      id: "",
    });
    document.querySelector("input[type='file']").value = "";
    setIsEditing(false);
    setCurrentEmployeeId("");
    setErrors({});
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/getEmployee");
      const employeeList = response.data.data;
      console.log(employeeList);
      setEmployees(employeeList);
    } catch (error) {
      console.error("Error fetching employees from the server", error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const deleteEmployee = async (id) => {
    try {
      const employeeDoc = doc(db, "employees", id);
      await deleteDoc(employeeDoc);
      await axios.delete(`http://localhost:5000/api/deleteEmployee/${id}`);
      setEmployees(employees.filter((employee) => employee.id !== id));
      alert("Employee deleted successfully");
    } catch (error) {
      console.error("Error deleting employee", error);
      alert("Error deleting employee.");
    }
  };

  const editEmployee = (employee) => {
    console.log("Editing employee:", employee);
    setNewEmployee({
      name: employee.Name,
      email: employee.email,
      phone: employee.phoneNumber,
      gender: employee.Gender,
      position: employee.Position,
      id: employee.Id,
    });
    setId(employee.id)
    setIsEditing(true);
    setCurrentEmployeeId(employee.Id);
    setActiveTab("form");

    console.log(id)
  };

  const handleUpdate = async () => {

    alert("clicked")
    console.log(id);
    console.log( newEmployee)

    const employeeData = {
      Name:  newEmployee.name,
      email:newEmployee.email,
      Gender:newEmployee.gender,
      phoneNumber:newEmployee.phone,
      Id:"234314876489",
      Position:newEmployee.position,
      Picture:"None"
     
   
    };


    console.log(employeeData)

    try {
      await axios.put(`http://localhost:5000/api/updateEmployee/${id}`, employeeData);
      setNewEmployee(employees.map(employee => (employee.id === currentEmployeeId ? newEmployee : employee)));
     console.log(employeeData,currentEmployeeId)
     alert("successful")
    } catch (error) {
      console.log(error.message)
      
    }
   
  }


  const uploadImageToFirebase = async (imageFile) => {
    const imageRef = ref(storage, `images/${imageFile.name}`);
    const snapshot = await uploadBytes(imageRef, imageFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  };

  const isEmployeeIdUnique = async (employeeId) => {
    const employeesCollectionRef = collection(db, "employees");
    const querySnapshot = await getDocs(employeesCollectionRef);
    return !querySnapshot.docs.some(
      (doc) => doc.data().employeeId === employeeId
    );
  };




  const handleSubmit = async () => {
    if (!validate()) return;

    let imageUrl = "";
    if (newEmployee.image) {
      imageUrl = await uploadImageToFirebase(newEmployee.image);
    }

    const employeeData = {
      Name: newEmployee.name,
      email: newEmployee.email,
      Picture: imageUrl,
      phoneNumber: newEmployee.phone,
      Gender: newEmployee.gender,
      Position: newEmployee.position,
    };

    try {
      const isUnique = await isEmployeeIdUnique(newEmployee.id);
      if (!isUnique) {
        alert("An employee with this ID already exists.");
        return;
      }

      const employeesCollectionRef = collection(db, "employees");
      const docRef = await addDoc(employeesCollectionRef, employeeData);
      await axios.post("http://localhost:5000/api/addEmployee", {
        ...employeeData,
        id: docRef.id,
      });

      alert("Employee Added Successfully!");

      resetForm();
      fetchEmployees();
    } catch (error) {
      console.error("Error submitting employee data", error);
      alert("Error Submitting Employee Data. Please check console for details.");
    }
  };


  const handleSearch = () => {
    setFilteredEmployees(
      employees.filter(
        (employee) =>
          (employee.name &&
            employee.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (employee.employeeId && employee.employeeId.includes(searchQuery))
      )
    );
    setActiveTab("list");
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch();
    }, 300);
  };

  const renderForm = () => (
    <>
      <input
        type="text"
        placeholder="Name"
        value={newEmployee.name || ""}
        onChange={(e) =>
          setNewEmployee({ ...newEmployee, name: e.target.value })
        }
      />

      <div className="error">{errors.name}</div>

      <input
        type="email"
        placeholder="Email"
        value={newEmployee.email || ""}
        onChange={(e) =>
          setNewEmployee({ ...newEmployee, email: e.target.value })
        }
      />
      <div className="error">{errors.email}</div>

      <input
        type="text"
        placeholder="PhoneNumber"
        value={newEmployee.phone || ""}
        onChange={(e) =>
          setNewEmployee({ ...newEmployee, phone: e.target.value })
        }
      />
      <div className="error">{errors.phone}</div>

      <input
        type="file"
        accept="image/*"
        onChange={(e) =>
          setNewEmployee({ ...newEmployee, image: e.target.files[0] })
        }
      />
      <div className="error">{errors.image}</div>

      <select
        className="styled-select"
        value={newEmployee.gender || ""}
        onChange={(e) =>
          setNewEmployee({ ...newEmployee, gender: e.target.value })
        }
      >
        <option value="">Select Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
      </select>
      <div className="error">{errors.gender}</div>

      <input
        type="text"
        placeholder="Position"
        value={newEmployee.position || ""}
        onChange={(e) =>
          setNewEmployee({ ...newEmployee, position: e.target.value })
        }
      />
      <div className="error">{errors.position}</div>

      <input
        type="text"
        placeholder="ID"
        value={newEmployee.id || ""}
        onChange={(e) => setNewEmployee({ ...newEmployee, id: e.target.value })}
      />
      <div className="error">{errors.id}</div>
      {isEditing ? (
        <button className="edit-btns" onClick={handleUpdate}>
          Update
        </button>
      ) : (
        <button className="submit-btns" onClick={handleSubmit}>
          Submit
        </button>
      )}

      {isEditing && <button onClick={resetForm}>Cancel</button>}
    </>
  );

  const renderEmployeeList = () => (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Profile Picture</th>
            <th>Name</th>
            <th>Email</th>
            <th>Gender</th>
            <th>Phone</th>
            <th>Position</th>
            <th>ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(searchQuery ? filteredEmployees : employees).length > 0 ? (
            (searchQuery ? filteredEmployees : employees).map((employee) => (
              <tr key={employee.id}>
                <td>
                  {employee.Picture ? (
                    <img
                      src={employee.Picture}
                      alt={employee.name || "Employee image"}
                      className="employee-image"
                    />
                  ) : (
                    "No image"
                  )}
                </td>
                <td>{employee.Name}</td>
                <td>{employee.email}</td>
                <td>{employee.Gender}</td>
                <td>{employee.phoneNumber}</td>
                <td>{employee.Position}</td>
                <td>{employee.Id}</td>
                <td>
                  <button
                    className="edit"
                    onClick={() => editEmployee(employee)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete"
                    onClick={() => deleteEmployee(employee.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8">No employees yet</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderSearch = () => (
    <>
      <input
        type="text"
        placeholder="Search for employee"
        value={searchQuery}
        onChange={handleSearchChange}
      />
      <button className="search" onClick={handleSearch}>
        Search
      </button>
    </>
  );

  return (
    <div className="app">
      <h1>Employee Registration Form</h1>
      <div className="tabs">
        <button
          onClick={() => setActiveTab("form")}
          className={activeTab === "form" ? "active-tab" : ""}
        >
          Employee Form
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className={activeTab === "list" ? "active-tab" : ""}
        >
          Employee List
        </button>
        <button
          onClick={() => setActiveTab("search")}
          className={activeTab === "search" ? "active-tab" : ""}
        >
          Search
        </button>
      </div>
      {activeTab === "form" && (
        <div>
          <h2 className="Two-headings">
            {isEditing ? "Edit Employee" : "Add Employee"}
          </h2>
          {renderForm()}
        </div>
      )}
      {activeTab === "list" && (
        <div>
          <h2 className="Two-headings">Employee List</h2>
          {renderEmployeeList()}
        </div>
      )}
      {activeTab === "search" && (
        <div>
          <h2 className="Query-heading">Employee Query</h2>
          {renderSearch()}
          { }
          {searchQuery && renderEmployeeList()}
        </div>
      )}
    </div>
  );
}

export default Form;