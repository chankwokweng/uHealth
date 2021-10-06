const { admin, db } = require('./admin');

module.exports = (request, response, next) => {
    let idToken;
    if (request.headers.authorization && request.headers.authorization.startsWith('Bearer ')) {
        idToken = request.headers.authorization.split('Bearer ')[1];
    } else {
        console.error('Auth: No token found');
        return response.status(403).json({ error: 'Unauthorized' });
    }
    admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
            request.user = decodedToken;
            console.log("auth:request.user=",request.user.email);
            return db.collection('users').where('email', '==', request.user.email).limit(1).get();
        })
        .then((data) => {
            console.log("auth:data=", data.docs[0].data().email);
            request.user.email = data.docs[0].data().email;
            request.user.imageUrl = data.docs[0].data().imageUrl;
            return next();
        })
        .catch((err) => {
            console.error('Auth: Error while verifying token', err);
            return response.status(403).json(err);
        });
};