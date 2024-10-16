const {
  collection,
  addDoc,
  doc,
  deleteDoc,
  getDocs,
  updateDoc,
} = require("firebase/firestore");
const { db } = require("../config/firebase");

const getEmployees = async (req, res) => {
  try {
    const querySnapshot = await getDocs(collection(db, "employees"));
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json({
      data: data,
    });
  } catch (error) {
    console.log("Error in getting employee", error);
  }
};

const addEmployee = async (req, res) => {
  const { Name, Gender, Position, Id, phoneNumber, email, Picture } = req.body;

  if (!Name || !Gender || !Position || !Id || !phoneNumber || !email || !Picture) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const docRef = await addDoc(collection(db, "employees"), {
      Name: Name,
      Gender: Gender,
      email: email,
      Position: Position,
      Id: Id,
      phoneNumber: phoneNumber,
      Picture: Picture,
    });

    res.json({
      message: "Added successfully",
    });
  } catch (error) {
    console.log("Error adding employee", error);
    res.status(500).json({ error: "Failed to add employee" });
  }
};


const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const { Name, email, Gender, phoneNumber, Id, Position } = req.body;

  try {
    const employeeDocRef = doc(db, "employees", id);

    const updateData = {
      Name,
      email,
      Gender,
      phoneNumber,
      Id,
      Position,
    };

   

    await updateDoc(employeeDocRef, updateData);

    res.json({ message: "Employee updated successfully" });
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({ error: "Failed to update employee" });
  }
};


const deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    const docRef = doc(db, "employees", id);
    await deleteDoc(docRef);
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.log("Deleting user error", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

module.exports = {
  addEmployee,
  deleteEmployee,
  getEmployees,
  updateEmployee,
};