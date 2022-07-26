"use strict";
import mongoDB = require('mongodb');
import config = require('../../../config/config.json');

export const connect = async () => {
    return await new mongoDB.MongoClient(config.dbURL).connect()
}

export const ping = async () => {
    const client = await connect()
    try {
        const db = client.db(config.dbName);
        const newPing = await db.command({ ping: 1 })
        return newPing.ok === 1 ?  { status: 'Success' } : { status: 'Failure' }
    } catch (e) {
        console.error(e)
    } finally {
        await client.close()
    }
}

export const setData = async (collection:string, filter:object, data:object)=> {
    const client = await connect()
    try {
        const db = client.db(config.dbName);
        const result = await db.collection(collection).updateOne(filter, {$set: data}, {upsert: true})
        console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`);
        return result;
    } catch (e) {
        console.error(e)
    } finally {
        await client.close()
    }
}

export const unsetData = async (collection:string, filter:object, data:object)=> {
    const client = await connect()
    try {
        const db = client.db(config.dbName);
        const result = await db.collection(collection).updateOne(filter, {$unset: data})
        console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`);
        return result;
    } catch (e) {
        console.error(e)
    } finally {
        await client.close()
    }
}

interface bulkUpdate {
    "updateOne": {
        "filter": object
        "update": { "$set": sbt.Item },
        "upsert": true
    }
}

export const bulkWriteToDb  = async (collection:string, bulkUpdateOps: bulkUpdate[]) => {
    const client = await connect()
    try {
        const db = client.db(config.dbName);
        return await db.collection(collection).bulkWrite(bulkUpdateOps)
    } catch (e) {
        console.error(e)
    } finally {
        await client.close()
    }
}

export const bulkUpdateItems = async (merge:object) => {
    let bulkUpdateOps: bulkUpdate[][] = []
    let index = 0
    let counter = 0;

    for (let i in merge) {
        let updateQuery = merge[i]._id ? {_id: merge[i]._id} : {SKU: i}
        if (merge[i]._id) delete merge[i]._id
        if (!bulkUpdateOps[index]) bulkUpdateOps[index] = []
        bulkUpdateOps[index].push({
            "updateOne": {
                "filter": updateQuery,
                "update": {"$set": merge[i]},
                "upsert": true
            }
        });
        counter++;
        if (counter % 1000 === 0) index++
    }

    let page = 0
    for (const bulk of bulkUpdateOps) {
        let start = new Date();
        console.log("Saving page " + page + "/" + bulkUpdateOps.length);
        let result = await bulkWriteToDb("Items", bulk)
        let finish = new Date();
        console.log("DB write took " + ((finish.getTime() - start.getTime()) / 1000) + "s");
        console.log(result);
        page++
    }

    return;
}

export const find = async <T>(collection:string, filter = {}, projection = {}, sort = {}, limit = 10000)=> {
    const client = await connect()
    try {
        const db = client.db(config.dbName);
        return await (db.collection(collection).find(filter).project(projection).limit(limit).sort(sort).toArray()) as T[]
    } catch (e) {
        console.error(e)
    } finally {
        await client.close()
    }
}

export const findAggregate = async (collection:string, aggregate:object[])=> {
    const client = await connect()
    try {
        const db = client.db(config.dbName);
        return await db.collection(collection).aggregate(aggregate).toArray()
    } catch (e) {
        console.error(e)
    } finally {
        await client.close()
    }
}

export const findOne = async (collection:string, filter = {}, projection = {}, sort = {}, limit = 10000)=> {
    const client = await connect()
    try {
        const db = client.db(config.dbName);
        return await db.collection(collection).findOne(filter, {projection: projection, sort:sort, limit:limit})
    } catch (e) {
        console.error(e)
    } finally {
        await client.close()
    }
}

export const findDistinct = async (collection:string, key:string, filter:object)=> {
    const client = await connect()
    try {
        const db = client.db(config.dbName);
        return await db.collection(collection).distinct(key,filter)
    } catch (e) {
        console.error(e)
    } finally {
        await client.close()
    }
}

export const deleteOne = async (collection:string, filter:object) => {
    const client = await connect()
    try {
        const db = client.db(config.dbName);
        const result = await db.collection(collection).deleteOne(filter)
        console.log(`${result.acknowledged}, deleted ${result.deletedCount} document(s)`);
    } catch (e) {
        console.error(e)
    } finally {
        await client.close()
    }
}


