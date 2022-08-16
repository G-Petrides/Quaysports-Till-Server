export const log = (path:string, log:any = {})=> {
    let timestamp = new Date()
    if(log._id) delete log._id
    let line = {date:timestamp.toJSON(), path:path, log:log}
    console.dir(line,{depth:3,colors:true})
}