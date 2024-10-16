const express =  require ("express");
const router = express.Router();
const {deleteEmployee, addEmployee, getEmployees, updateEmployee }  =  require('../controllers/db')

router.post('/addEmployee' , addEmployee)
router.delete('/deleteEmployee/:id',deleteEmployee)
router.get('/getEmployee', getEmployees)
router.put('/updateEmployee/:id',updateEmployee)

module.exports =  router ;