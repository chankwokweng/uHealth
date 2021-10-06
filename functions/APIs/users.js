const { admin, db } = require('../util/admin');
const firebaseConfig = require('../util/firebaseConfig');

const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const firebase = require('firebase/app');
const { validateLoginData, validateSignUpData } = require('../util/validators');

firebase.initializeApp(firebaseConfig);
auth = getAuth();

//--------- Login
exports.loginUser = (request, response) => {
    console.log("loginUser:request=", request);

    const user = {
        email: request.body.email,
        password: request.body.password
    }

    const { valid, errors } = validateLoginData(user);
    if (!valid) return response.status(400).json(errors);

    signInWithEmailAndPassword(auth, user.email, user.password)
        .then((data) => {
            return data.user.getIdToken();
        })
        .then((token) => {
            return response.status(200).json({ token });
        })
        .catch((error) => {
            console.error(error);
            return response.status(403).json({ general: 'wrong credentials, please try again' });
        })
};

//--------- Signup
exports.signUpUser = (request, response) => {
    const newUser = {
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        email: request.body.email,
        phoneNumber: request.body.phoneNumber,
        // country: request.body.country,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        // username: request.body.username
    };
    console.log("signUpUser:newUser=", newUser);

    const { valid, errors } = validateSignUpData(newUser);
    console.log("signUpUser:validate=", valid, "=", errors);

    if (!valid) return response.status(400).json(errors);

    let token, userId;
    db
        .doc(`/users/${newUser.email}`)
        .get()
        .then((doc) => {
            if (doc.exists) {
                console.log("signUpUser:email already taken=",newUser.email);
                return response.status(400).json({ email: 'this email is already taken' });
            } else {
                console.log("signUpUser:newUser=createUserWithEmailAndPassword");
                return createUserWithEmailAndPassword(
                        auth,
                        newUser.email,
                        newUser.password
                    );
            }
        })
        .then((data) => {
            userId = data.user.uid;
            console.log("signUpUser:newUser:createUserWithEmailAndPassword success:uid,token", userId, data.user.getIdToken());
            return data.user.getIdToken();
        })
        .then((idtoken) => {
            token = idtoken;
            // console.log("token=", token);

            const userCredentials = {
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                phoneNumber: newUser.phoneNumber,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId
            };
            return db
                .doc(`/users/${newUser.email}`)
                .set(userCredentials);
        })
        .then(() => {
            return response.status(201).json({ token });
        })
        .catch((err) => {
            console.log("signUpUser:err=", err);
            console.log("signUpUser:err.code=", err.code);
            if (err.code === 'auth/email-already-in-use') {
                return response.status(400).json({ email: 'Email already in use' });
            } else if (err.code === 'auth/weak-password')
            {
                return response.status(400).json({ password: 'Please use a stronger password' });

            } else {
                return response.status(500).json({ general: 'Something went wrong, please try again' });
            }
        });
}

deleteImage = (imageName) => {
    const bucket = admin.storage().bucket();
    const path = `${imageName}`
    return bucket.file(path).delete()
        .then(() => {
            return
        })
        .catch((error) => {
            return
        })
}

// Upload profile picture
exports.uploadProfilePhoto = (request, response) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');
    const busboy = new BusBoy({ headers: request.headers });

    let imageFileName="undefined";
    let imageToBeUploaded = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        console.log("uploadProfilePhoto:filename", filename);
        console.log("uploadProfilePhoto:request.user.", request.user);

        if (mimetype !== 'image/png' && mimetype !== 'image/jpeg') {
            return response.status(400).json({ error: 'Wrong file type submited' });
        }
        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        imageFileName = `${request.user.uid}.${imageExtension}`;
        const filePath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = { filePath, mimetype };
        file.pipe(fs.createWriteStream(filePath));
    });
    deleteImage(imageFileName);
    busboy.on('finish', () => {
        admin
            .storage()
            .bucket()
            .upload(imageToBeUploaded.filePath, {
                resumable: false,
                metadata: {
                    metadata: {
                        contentType: imageToBeUploaded.mimetype
                    }
                }
            })
            .then(() => {
                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media`;
                return db.doc(`/users/${request.user.email}`).update({
                    imageUrl
                });
            })
            .then(() => {
                return response.json({ message: 'Image uploaded successfully' });
            })
            .catch((error) => {
                console.error(error);
                return response.status(500).json({ error: error.code });
            });
    });
    busboy.end(request.rawBody);
};


exports.getUserDetail = (request, response) => {
    console.log ("getUserDetail:request.user=",request.user);

    let userData = {};
    db
        .doc(`/users/${request.user.email}`)
        .get()
        .then((doc) => {
            if (doc.exists) {
                userData.userCredentials = doc.data();
                return response.json(userData);
            }
        })
        .catch((error) => {
            console.error(error);
            return response.status(500).json({ error: error.code });
        });
}

exports.updateUserDetail = (request, response) => {
    console.log("updateUserDetail:request.user=", request.user);
    console.log("updateUserDetail:request.body=", request.body);

    let document = db.collection('users').doc(`${request.user.email}`);
    document.update(request.body)
        .then(() => {
            response.json({ message: 'Updated successfully' });
        })
        .catch((error) => {
            console.error(error);
            return response.status(500).json({
                message: "Cannot Update the value"
            });
        });
}