export const log = (path:string, log:any = {})=> {
    let timestamp = new Date()
    let line = {date:timestamp.toJSON(), path:path, log:log}
    console.dir(line,{depth:3,colors:true})
}