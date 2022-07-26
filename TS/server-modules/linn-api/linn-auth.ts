import mongoI = require("../mongo-interface/mongo-interface")
import https = require('https');

let connectionDetails = {server:"", token:""}

export const auth = async (workerThread: boolean) => {
    if (workerThread) {
        return await getLinnworksAuthDetailsFromDB()
    } else {
        return await connectToLinnworksAndGetAuth()
    }
}

const connectToLinnworksAndGetAuth = () => {
    return new Promise<void>(async (resolve)=>{
        let postOptions = {
            hostname: 'api.linnworks.net',
            method: 'POST',
            path: '/api/Auth/AuthorizeByApplication',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
        };
        let postData = 'applicationId=5e98796e-63fb-4188-a73b-0b05456f081e&applicationSecret=ad4c386b-d125-4961-9f3c-36340dd33753&token=14744072963ee9ace93725ca8a8c70b2';
        let str = '';
        let postReq = https.request(postOptions,  (res) => {
            res.setEncoding('utf8');

            res.on('data', chunk => { str += chunk });

            res.on('end', async () => {
                let data = JSON.parse(str);
                connectionDetails = {server: data['Server'].replace('https://', ''), token: data['Token']};
                console.log('---- Linn Auth ----');
                console.dir(connectionDetails);
                await mongoI.setData("Server", {id: "Linnworks"}, {id: "Linnworks", details: connectionDetails});
                console.log('---- Linn Auth Saved ----');
                resolve();
            });
        });
        postReq.write(postData);
        postReq.end()
    })
}

const getLinnworksAuthDetailsFromDB = async () => {
    const result = await mongoI.findOne("Server", {id: "Linnworks"})
    console.dir(result.details)
    connectionDetails = result.details
    return
}

export const getAuthDetails = () => {
    return connectionDetails
}