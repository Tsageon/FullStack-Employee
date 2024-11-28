import React, { useState, useRef, useEffect } from "react";
import { storage, db } from "../Config/firebase";
import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  getDocs,
  query,
  where
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import axios from "axios";
import Swal from 'sweetalert2'
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
  
  
    const hasErrors = Object.values(tempErrors).some((x) => x !== "");
  
    if (hasErrors) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'There are validation errors. Please check the fields.',
        footer: 'Correct the errors to continue.'
      });
      return false;
    }
  
    return true;
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

    Swal.fire({
      icon: 'error',
      title: 'Error Fetching Employees',
      text: 'There was an issue fetching employee data. Please try again later.',
      footer: 'If the issue persists, contact support.'
    });
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
      Swal.fire({
        icon: 'success',
        title: 'Employee Deleted',
        text:'Employee deleted successfully'});
    } catch (error) {
      console.error("Error deleting employee", error);
      Swal.fire({
        icon: 'error',
        title: 'Error Deleting Employee',
        text: 'There was an issue deleting the employee data. Please try again later.',
        footer: 'If the issue persists, contact support.'
      });
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
      idNumber: employee.IdNumber,
    });
    setId(employee.idNumber)
    setIsEditing(true);
    setCurrentEmployeeId(employee.IdNumber);
    setActiveTab("form");
    console.log(id)
  };

  const handleUpdate = async () => {
    const employeeData = {
      Name: newEmployee.name,
      email: newEmployee.email,
      Gender: newEmployee.gender,
      phoneNumber: newEmployee.phone,
      IdNumber: newEmployee.idNumber, 
      Position: newEmployee.position,
      Picture: "None",
    };
  
    console.log("Employee Data to Update:", employeeData);
    console.log("Employee ID:", newEmployee.idNumber);
  
    if (!newEmployee.idNumber) { 
      Swal.fire({
        icon: 'error',
        title: 'Missing Employee ID',
        text: 'The Employee ID is required for updating.',
        confirmButtonText: 'OK',
      });
      return;
    }
  
    try {
      await axios.put(`http://localhost:5000/api/updateEmployee/${newEmployee.idNumber}`, employeeData);
  
      setEmployees((prevEmployees) =>
        prevEmployees.map((employee) =>
          employee.id === currentEmployeeId ? { ...employee, ...newEmployee } : employee
        )
      );
  
      Swal.fire({
        icon: 'success',
        title: 'Employee Updated',
        text: 'The employee data was successfully updated.',
        footer: 'Employee details are now updated.'
      });
  
      console.log(employeeData, currentEmployeeId);
    } catch (error) {
      console.log(error.message);
  
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'There was an issue updating the employee data. Please try again.',
        footer: 'If the issue persists, contact support.'
      });
    }
  };
  


  const uploadImageToFirebase = async (imageFile) => {
    const imageRef = ref(storage, `images/${imageFile.name}`);
    const snapshot = await uploadBytes(imageRef, imageFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  };

  const isEmployeeIdUnique = async (employeeId) => {
    const employeesCollectionRef = collection(db, "employees");
  
    console.log("Checking if employee ID is unique:", employeeId);

    const querySnapshot = await getDocs(
      query(employeesCollectionRef, where("IdNumber", "==", employeeId))
    );
  
    console.log("Query result length:", querySnapshot.size);
  
   
    return querySnapshot.empty; 
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
    IdNumber: newEmployee.idNumber,
    phoneNumber: newEmployee.phone,
    Gender: newEmployee.gender,
    Position: newEmployee.position,
  };
  
  console.log("Employee ID Number:", newEmployee.idNumber); 

  try {
    const isUnique = await isEmployeeIdUnique(newEmployee.idNumber);
    if (!isUnique) {
      Swal.fire({
        icon: 'error',
        title: 'Employee ID Already Exists',
        text: 'An employee with this ID already exists.',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (!newEmployee.idNumber) {
      Swal.fire({
        icon:'warning',
        title: 'Employee ID Not Provided',
        text:'Employee ID is required.',});
      return;
    }

    console.log("New Employee Data:", newEmployee);


    const employeesCollectionRef = collection(db, "employees");
    const docRef = await addDoc(employeesCollectionRef, employeeData);
    await axios.post("http://localhost:5000/api/addEmployee", {
      ...employeeData,
      id: docRef.id,
    });

    Swal.fire({
      icon: 'success',
      title: 'Employee Added Successfully!',
      text: 'The employee was successfully added.',
      confirmButtonText: 'OK'
    });

    resetForm();
    fetchEmployees();
  } catch (error) {
    console.error("Error submitting employee data", error);

    Swal.fire({
      icon: 'error',
      title: 'Error Submitting Employee Data',
      text: 'Please check the console for more details.',
      footer: 'If the issue persists, contact support.',
      confirmButtonText: 'OK'
    });
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
  value={newEmployee.idNumber || ""}
  onChange={(e) =>
    setNewEmployee({ ...newEmployee, idNumber: e.target.value })  
  }
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