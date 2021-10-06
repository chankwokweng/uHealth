const { db } = require('../util/admin');

exports.getAllClients = (request, response) => {
    // console.log("getAllClients:request=", request.user);

    db
        .collection('clients')
        .where('consultantId', '==', request.user.email)
        .orderBy('name')
        .get()
        .then((data) => {
            let clients = [];
            data.forEach((doc) => {
                // console.log("getAllClients:doc=", doc);
                clients.push({
                    clientId:                       doc.id,
                    consultantId:                   doc.data().consultantId,
                    createdAt:                      doc.data().createdAt,
                    name:                           doc.data().name,
                    gender:                         doc.data().gender,
                    address:                        doc.data().address,
                    profession:                     doc.data().profession,
                    telephone_day:                  doc.data().telephone_day,
                    telephone_night:                doc.data().telephone_night,
                });
            });
            // console.log("getAllClients:response=", response.json(clients));
            return response.json(clients);
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        });
};

//----------- Client - Basic Info
// --------------------------------------------
exports.createClientInfo = (request, response) => {
    console.log("createClientInfo:request.user.email=", request.user.email);
    // console.log("createClientInfo:request.body=", request.body);

    if (request.body.name.trim() === '') {
        return response.status(400).json({ name: 'Must not be empty' });
    }

    if (request.body.telephone_day.trim() === '') {
        return response.status(400).json({ telephone_day: 'Must not be empty' });
    }

    const newClientInfo = {
        createdAt: new Date().toISOString(),
        consultantId:   request.user.email,
        name:           request.body.name,
        gender:         request.body.gender,
        telephone_day:  request.body.telephone_day,
        telephone_night: request.body.telephone_night,
        address:        request.body.address,
        profession:     request.body.profession,

    }
    db
        .collection('clients')
        .add(newClientInfo)
        .then((doc) => {
            const responseClientInfo = newClientInfo;
            responseClientInfo.id = doc.id;
            return response.json(responseClientInfo);
        })
        .catch((err) => {
            response.status(500).json({ error: 'Something went wrong' });
            console.error(err);
        });
};

exports.updateClientInfo = (request, response) => {
    console.log("updateClientInfo:request.params=", request.params);

    if (request.body.clientId || request.body.createdAt) {
        response.status(403).json({ message: 'Not allowed to edit' });
    }
    let document = db.collection('clients').doc(request.params.clientId);
    console.log("updateClientInfo:document=", document);

    document.update(request.body)
        .then(() => {
            response.json({ message: 'Updated successfully' });
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({
                error: err.code
            });
        });
};

exports.getClientInfo = (request, response) => {
    console.log("getClientDetail:request.params=", request.params);

    let clientData = {};
    db
        .doc(`/clients/${request.params.clientId}`)
        .get()
        .then((doc) => {
            // console.log('getClientInfo doc=', doc);
            if (doc.exists) {
                clientData = doc.data();
                console.log('getClientInfo clientData=', clientData);
                return response.json(clientData);
            }
        })
        .catch((error) => {
            console.log('getClientInfo error=', error);
            return response.status(500).json({ error: error.code });
        });
}

//----------- Client - List of conultations
// --------------------------------------------
exports.getClientConsultations = (request, response) => {
    console.log("getClientConsultations:request.params=", request.params);

    let consultations = [];

    db
        .collection('clients')
        .doc(request.params.clientId)
        .collection('consultations')
        .get()
        .then((data) => {
            data.forEach((doc) => {
                let temp = {basicInfo: doc.data().basicInfo};
                temp['consultationId'] = doc.id;
                console.log("getClientConsultations:doc=", doc.id, ':', temp);
                consultations.push(temp);
            });
            // console.log("getClientConsultations:response=", consultations);
            return response.json(consultations);
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        });
}

//----------- Client - Create a new consultation
// --------------------------------------------

exports.createClientConsultation = (request, response) => {
    console.log("createClientConsultation:request.params=", request.params);
    // console.log("createClientConsultationrequest.body=", request.body);

    db
        .collection('clients')
        .doc(request.params.clientId)
        .collection('consultations')
        .add(request.body)
        .then((doc) => {
            const responseConsultationInfo = request.body;
            responseConsultationInfo.id = doc.id;
            // console.log("createClientConsultation:response=", response.json(responseConsultationInfo));
            console.log("createClientConsultation:response=");
            return response.json(responseConsultationInfo);
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        });
}

exports.getClientConsultationDetail = (request, response) => {
    console.log("getClientConsultationDetail:request.params=", request.params);
    // console.log("getClientConsultationDetail.body=", request.body);

    db
        .collection('clients')
        .doc(request.params.clientId)
        .collection('consultations')
        .doc(request.params.consultationId)
        .get()
        .then((doc) => {
            const responseConsultationInfo = doc.data();
            responseConsultationInfo.id = doc.id;
            // console.log("getClientConsultationDetail:response=", responseConsultationInfo);
            return response.json(responseConsultationInfo);
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        });
}

exports.updateClientConsultationDetail = (request, response) => {
    console.log("updateClientConsultationDetail:request.params=", request.params);
    console.log("updateClientConsultationDetail.body=", request.body);

    db
        .collection('clients')
        .doc(request.params.clientId)
        .collection('consultations')
        .doc(request.params.consultationId)
        .update(request.body)
        .then(() => {
            response.json({ message: 'Updated successfully' });
        })
            .catch((err) => {
                console.error(err);
                return response.status(500).json({
                    error: err.code
                });
        });
}