"use strict";
import mongoDB = require('mongodb');
import config = require('../../Config/config.json');

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

