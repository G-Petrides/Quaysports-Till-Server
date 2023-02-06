"use strict";
import mongoDB = require('mongodb');
import config = require('../../config/config.json');

export const connect = async () => await new mongoDB.MongoClient(config.dbURL).connect()

export async function ping() {
    const client = await connect()
    try {
        const db = client.db(config.dbName);
        const newPing = await db.command({ping: 1})
        return newPing.ok === 1 ? {status: 'Success'} : {status: 'Failure'}
    } catch (e) {
        console.error(e)
    } finally {
        await client.close()
    }
}

export async function setData(
    collection: string,
    filter: object,
    data: object)
{
    const client = await connect()
    try {
        const db = client.db(config.dbName);
        return await db.collection(collection)
            .updateOne(
                filter,
                {$set: data},
                {upsert: true}
            );
    } catch (e) {
        console.error(e)
    } finally {
        await client.close()
    }
}

export async function find<T extends mongoDB.Document>(
    collection: string,
    filter = {},
    projection = {},
    sort = {},
    limit = 10000)
    : Promise<T[] | undefined>
{
    const client = await connect()
    try {
        const db = client.db(config.dbName);
        return await db.collection<T>(collection)
            .find(filter)
            .project(projection)
            .limit(limit)
            .sort(sort)
            .toArray() as T[]
    } catch (e) {
        console.error(e)
    } finally {
        await client.close()
    }
}

export async function findOne<T>(
    collection: string,
    filter = {},
    projection = {},
    sort = {},
    limit = 10000)
    : Promise<T | null>
{
    const client = await connect()
    try {
        const db = client.db(config.dbName);
        return await db.collection(collection)
            .findOne<T>(
                filter,
                {
                    projection: projection,
                    sort: sort,
                    limit: limit
                })
    } catch (e) {
        console.error(e)
        return null
    } finally {
        await client.close()
    }
}

export async function findAggregate<T extends mongoDB.Document>(
    collection: string,
    aggregate: object[])
    : Promise<T[] | undefined>
{
    const client = await connect()
    try {
        const db = client.db(config.dbName);
        return await db.collection<T>(collection)
            .aggregate(aggregate, {serializeFunctions: true})
            .toArray() as T[]
    } catch (e) {
        console.error(e)
    } finally {
        await client.close()
    }
}