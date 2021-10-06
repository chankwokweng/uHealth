const functions = require('firebase-functions');
const app = require('express')();
const auth = require('./util/auth');

//========= Users
const {
    loginUser,
    signUpUser,
    uploadProfilePhoto,
    getUserDetail,
    updateUserDetail
} = require('./APIs/users')

// Users
app.post('/login', loginUser);
app.post('/signup', signUpUser);
app.post('/user/image', auth, uploadProfilePhoto);
app.get('/user', auth, getUserDetail);
app.post('/user', auth, updateUserDetail);


//========= Clients
const {
    getAllClients,
    createClientInfo,
    updateClientInfo,
    getClientInfo,
    getClientConsultations,
    createClientConsultation,
    getClientConsultationDetail,
    updateClientConsultationDetail
} = require('./APIs/clients')


app.get('/clients', auth, getAllClients);
app.post('/client', auth, createClientInfo)
app.post('/client/:clientId', auth, updateClientInfo)
app.get('/client/:clientId', auth, getClientInfo)
app.get('/consultations/:clientId', auth, getClientConsultations)
app.post('/consultation/:clientId', auth, createClientConsultation)
app.get('/consultation/:clientId/:consultationId', auth, getClientConsultationDetail)
app.post('/consultation/:clientId/:consultationId', auth, updateClientConsultationDetail)


//========= 
exports.api = functions.https.onRequest(app);