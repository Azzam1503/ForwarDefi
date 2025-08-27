import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "async_hooks";

@Injectable()
export class AsyncStorageService {
  private async_local_storage = new AsyncLocalStorage<Map<string, any>>();

  run(callback: () => void) {
    const store = new Map();
    this.async_local_storage.run(store, callback);
  }

  getStore(): Map<string, any> | undefined {
    return this.async_local_storage.getStore();
  }

  set(key: string, value: any) {
    const store = this.getStore();
    if (store) {
      store.set(key, value);
    }
  }

  get(key: string): any {
    const store = this.getStore();
    return store?.get(key);
  }
}
