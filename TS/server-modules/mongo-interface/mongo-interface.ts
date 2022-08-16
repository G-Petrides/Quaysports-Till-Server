"use strict";
import mongoDB = require('mongodb');
import config = require('../../config/config.json');

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
        return await db.collection(collection).updateOne(filter, {$set: data}, {upsert: true});
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
        return await (db.collection(collection).find<T>(filter).project(projection).limit(limit).sort(sort).toArray())
    } catch (e) {
        console.error(e)
    } finally {
        await client.close()
    }
}

export const findOne = async <T>(collection:string, filter = {}, projection = {}, sort = {}, limit = 10000)=> {
    const client = await connect()
    try {
        const db = client.db(config.dbName);
        return await db.collection(collection).findOne<T>(filter, {projection: projection, sort:sort, limit:limit})
    } catch (e) {
        console.error(e)
    } finally {
        await client.close()
    }
}

