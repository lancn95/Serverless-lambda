import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { parseUserId } from '../../auth/utils.mjs'

const dynamoDbClient = DynamoDBDocument.from(new DynamoDB())

const todosTable = process.env.TODOS_TABLE

export async function handler(event) {
  console.log('Processing event: ', event)
  const todoId = event.pathParameters.todoId
  console.log('TodoId: ', todoId)

  const authorization = event.headers.Authorization
  const userId = parseUserId(authorization);
  console.log('UserId: ', userId)

  await dynamoDbClient.delete({
    TableName: todosTable,
    Key: {
      userId: userId,   // Partition key
      todoId: todoId    // Sort key
    },
    ConditionExpression: 'attribute_exists(todoId)'
  })

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: null
  }
}

