import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import { parseUserId } from '../../auth/utils.mjs'

const dynamoDbClient = DynamoDBDocument.from(new DynamoDB())


const todosTable = process.env.TODOS_TABLE


export async function handler(event) {
  console.log('Processing event: ', event)
  const todoId = uuidv4()

  const newTodo = JSON.parse(event.body)

  const authorization = event.headers.Authorization
  const userId = parseUserId(authorization);

  const timestamp = new Date().toISOString()

  const todo = {
    todoId: todoId,
    createdAt: timestamp,
    userId,
    ...newTodo
  }
  console.log('Storing new item: ', todo)

  await dynamoDbClient.put({
    TableName: todosTable,
    Item: todo
  })

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      todo
    })
  }
}


