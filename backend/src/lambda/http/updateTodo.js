import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { parseUserId } from '../../auth/utils.mjs'

const dynamoDbClient = DynamoDBDocument.from(new DynamoDB())
const todosTable = process.env.TODOS_TABLE

export async function handler(event) {
  console.log('Processing event: ', event)
  const todoId = event.pathParameters.todoId
  console.log('TodoId: ', todoId)
  const updatedTodo = JSON.parse(event.body)

  const authorization = event.headers.Authorization
  const userId = parseUserId(authorization);
  console.log('UserId: ', userId)

  await dynamoDbClient.update({
    TableName: todosTable,
    Key: {
      userId: userId, // Partition key
      todoId: todoId  // Sort key
    },
    UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
    ExpressionAttributeNames: {
      '#name': 'name'
    },
    ExpressionAttributeValues: {
      ':name': updatedTodo.name,
      ':dueDate': updatedTodo.dueDate,
      ':done': updatedTodo.done
    },
    ConditionExpression: 'attribute_exists(todoId)', 
    ReturnValues: 'UPDATED_NEW'
  })

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      updatedTodo
    })
  }
}
