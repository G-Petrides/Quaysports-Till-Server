import mongoI = require('../mongo-interface/mongo-interface');

export const auth = async (code: string) => {
    return await mongoI.findOne("Users", {pin: {$eq: code}})
}

