import {findOne} from "../mongo-interface/mongo-interface";

export const auth = async (code: string) => {
    return await findOne("Users", {pin: {$eq: code}}, {username:1, role:1})
}