"use strict";
import {MongoClient, Document} from 'mongodb';

export const connect = async () => {
    let url = process.env.DBURL
    if (!url) {
        console.error('No DBURL found in environment variables')
        process.exit(1)
    }
    return await new MongoClient(url).connect()
}

export async function ping() {
    const client = await connect()
    try {
        const db = client.db(process.env.DBNAME);
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
        const db = client.db(process.env.DBNAME);
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

export async function find<T extends Document>(
    collection: string,
    filter = {},
    projection = {},
    sort = {},
    limit = 10000)
    : Promise<T[] | undefined>
{
    const client = await connect()
    try {
        const db = client.db(process.env.DBNAME);
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
        const db = client.db(process.env.DBNAME);
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

export async function findAggregate<T extends Document>(
    collection: string,
    aggregate: object[])
    : Promise<T[] | undefined>
{
    const client = await connect()
    try {
        const db = client.db(process.env.DBNAME);
        return await db.collection<T>(collection)
            .aggregate(aggregate, {serializeFunctions: true})
            .toArray() as T[]
    } catch (e) {
        console.error(e)
    } finally {
        await client.close()
    }
}