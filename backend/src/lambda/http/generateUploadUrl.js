import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import AWSXRay from 'aws-xray-sdk-core'
import { v4 as uuidv4 } from 'uuid'
import { parseUserId } from '../../auth/utils.mjs'

const dynamoDb = AWSXRay.captureAWSv3Client(new DynamoDB())
const dynamoDbClient = DynamoDBDocument.from(dynamoDb)
const s3Client = new S3Client()

const todosTable = process.env.TODOS_TABLE
const bucketName = process.env.IMAGES_S3_BUCKET
const urlExpiration = parseInt(process.env.SIGNED_URL_EXPIRATION)

export async function handler(event) {
  console.log('Caller event', event)
  const todoId = event.pathParameters.todoId
  console.log('TodoId: ', todoId)

  const authorization = event.headers.Authorization
  const userId = parseUserId(authorization);
  console.log('UserId: ', userId)
  
  const validTodoId = await todoExists(todoId, userId)
  if (!validTodoId) {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        error: 'Todo does not exist'
      })
    }
  }

  const imageId = uuidv4()
  await updateAttachmentForTodoByTodoIdAndUserId(todoId, userId, imageId)

  const url = await getUploadUrlByImageId(imageId)
  console.log('URL: ', url)

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      uploadUrl: url
    })
  }
}

async function todoExists(todoId, userId) {
  const result = await dynamoDbClient.get({
    TableName: todosTable,
    Key: {
      userId: userId, // Partition key
      todoId: todoId  // Sort key
    }
  })

  console.log('Get todo: ', result)
  return !!result.Item
}

async function updateAttachmentForTodoByTodoIdAndUserId(todoId, userId, imageId) {
  //attachmentUrl
  const attachmentUrl = `https://${bucketName}.s3.amazonaws.com/${imageId}`
  await dynamoDbClient.update({
    TableName: todosTable,
    Key: {
      userId: userId,  // Partition key
      todoId: todoId   // Sort key
    },
    UpdateExpression: 'set attachmentUrl = :attachmentUrl',
    ExpressionAttributeValues: {
      ':attachmentUrl': attachmentUrl
    },
    ConditionExpression: 'attribute_exists(todoId)',
    ReturnValues: 'UPDATED_NEW'
  })

}

async function getUploadUrlByImageId(imageId) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: imageId
  })
  const url = await getSignedUrl(s3Client, command, {
    expiresIn: urlExpiration
  })
  return url
}