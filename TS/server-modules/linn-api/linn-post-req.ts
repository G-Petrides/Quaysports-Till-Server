import https = require('https');
import LinnAuth  = require('./linn-auth')
export const agent = new https.Agent();
agent.maxSockets = 10;

const postOpts = (path: string) => {
    let serverDetails = LinnAuth.getAuthDetails()
    return {
        hostname: serverDetails.server,
        method: 'POST',
        path: path,
        headers: {
            'Authorization': serverDetails.token,
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        }
    }
}
export const postReq = (path: string, postData: string): Promise<any> => {
    return new Promise<string>(resolve => {
        let str = '';
        let postReq = https.request(postOpts(path), res => {
            res.setEncoding('utf8');
            res.on('data', chunk => str += chunk);
            res.on('end', () => {
                resolve(str)
            });
        });

        postReq.on('error', (err) => {
            console.error('--------- Linnworks Connection Error ---------')
            console.dir(err)
            console.error(path + ' error')
            console.error('----------------------------------------------')
        });

        postReq.write(postData);
        postReq.end()
    })
}