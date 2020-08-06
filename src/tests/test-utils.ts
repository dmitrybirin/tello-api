import * as dgram from 'dgram'
import { AddressInfo } from 'net'

export const sendFromServerOnCommand = async (testServer: dgram.Socket, message: string) =>
    new Promise((res) => {
        testServer.once('message', (msg, info: AddressInfo) => {
            testServer.send(message, info.port, info.address, () => res())
        })
    })
