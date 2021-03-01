import osu from 'node-os-utils'
import process from 'process'
import moment from 'moment'
import {
  defaultConfiguration,
  Configuration,
  onConnectPayload,
  onDisconnectPayload, onCreateDocumentPayload, onChangePayload,
} from '@hocuspocus/server'
import {
  AbstractType, Doc, encodeStateAsUpdate, YEvent,
} from 'yjs'

export class Collector {

  serverConfiguration: Partial<Configuration> = defaultConfiguration

  connections = 0

  messages = 0

  documents = 0

  async memory() {
    const memory = await osu.mem.info()

    return {
      free: memory.freeMemMb,
      total: memory.totalMemMb,
      usage: 100 - memory.freeMemPercentage,
    }
  }

  async cpu() {
    return {
      count: osu.cpu.count(),
      model: osu.cpu.model(),
      usage: await osu.cpu.usage(),
    }
  }

  connect(data: onConnectPayload) {
    const { documentName } = data

    this.connections += 1

    return {
      action: 'connected',
      documentName,
    }
  }

  disconnect(data: onDisconnectPayload) {
    const { documentName } = data

    this.connections -= 1

    return {
      action: 'disconnected',
      documentName,
    }
  }

  connectionCount() {
    return {
      count: this.connections,
    }
  }

  createDocument(data: onCreateDocumentPayload) {
    const { documentName, document } = data

    this.documents += 1

    return {
      action: 'created',
      documentName,
      document: Collector.readableYDoc(document),
    }
  }

  changeDocument(data: onChangePayload) {
    const { documentName, document } = data

    this.messages += 1

    return {
      action: 'changed',
      documentName,
      document: Collector.readableYDoc(document),
    }
  }

  messageCount() {
    const count = this.messages
    this.messages = 0

    return { count }
  }

  documentCount() {
    const count = this.documents
    this.documents = 0

    return { count }
  }

  info() {
    return {
      version: process.version,
      platform: process.platform,
      started: moment().subtract(process.uptime(), 'second').toISOString(),
      configuration: this.serverConfiguration,
    }
  }

  private static readableYDoc(doc: Doc): any {
    const data = {}

    doc.share?.forEach((item, key) => {
      console.log(item.toJSON(), key)
      // TODO: fix crapcode
      // @ts-ignore
      // eslint-disable-next-line no-underscore-dangle
      // const type = item._start?.content?.type?.constructor?.name
      //
      // const handlers = {
      //   YXmlElement() {
      //     return doc.getXmlFragment(key).toJSON()
      //   },
      // }
      //
      // // @ts-ignore
      // data[key] = handlers[type] ? handlers[type]() : null
    })

    return data
  }

}