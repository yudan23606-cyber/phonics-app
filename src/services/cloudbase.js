import cloudbase from '@cloudbase/js-sdk'
import Constants from 'expo-constants'

const ENV_ID = Constants.expoConfig?.extra?.cloudbaseEnvId || 'resume-1-d5gn952g8682d6d1b'

const app = cloudbase.init({ env: ENV_ID })
const db = app.database()
const auth = app.auth({ persistence: 'local' })

let loginPromise = null
let loginAttempts = 0
let currentUid = null

async function getUserId() {
  if (currentUid) return currentUid

  if (!loginPromise) {
    loginPromise = auth.anonymousAuthProvider().signIn().then(() => {
      const loginState = auth.hasLoginState()
      if (loginState) {
        currentUid = loginState.user.uid
        console.log('CloudBase anonymous login success:', currentUid)
        return currentUid
      }
      throw new Error('Login failed')
    }).catch(err => {
      loginAttempts++
      if (loginAttempts > 3) {
        loginAttempts = 0
        loginPromise = null
      }
      console.error('CloudBase login failed (attempt ' + loginAttempts + '):', err)
      throw err
    })
  }

  return loginPromise
}

async function callFunction(name, data = {}) {
  try {
    await getUserId()
    const res = await app.callFunction({ name, data })
    return res.result || res
  } catch (err) {
    console.error('Cloud function ' + name + ' failed:', err)
    throw err
  }
}

async function query(collection, where = {}, options = {}) {
  try {
    await getUserId()
    let q = db.collection(collection).where(where)
    if (options.orderBy) {
      q = q.orderBy(options.orderBy.field, options.orderBy.order)
    }
    if (options.skip) q = q.skip(options.skip)
    if (options.limit) q = q.limit(options.limit)
    const res = await q.get()
    return res.data || []
  } catch (err) {
    console.error('Query ' + collection + ' failed:', err)
    throw err
  }
}

async function getOne(collection, where = {}) {
  const data = await query(collection, where, { limit: 1 })
  return data.length > 0 ? data[0] : null
}

async function add(collection, data) {
  await getUserId()
  return db.collection(collection).add(data)
}

async function update(collection, id, data) {
  await getUserId()
  return db.collection(collection).doc(id).update(data)
}

async function uploadFile(cloudPath, localUri) {
  await getUserId()
  const res = await app.uploadFile({ cloudPath, filePath: localUri })
  return res
}

export default {
  app,
  db,
  getUserId,
  callFunction,
  query,
  getOne,
  add,
  update,
  uploadFile
}
