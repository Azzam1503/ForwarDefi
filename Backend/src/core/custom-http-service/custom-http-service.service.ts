import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { CustomLogger } from 'src/core/logger/logger.service';
import { AxiosRequestConfig } from 'axios';
import { AsyncStorageService } from '../async-storage/async-storage.service';
import { ConfigService } from '@nestjs/config';
const lodash = require('lodash');

@Injectable()
export class CustomHttpService {
  constructor(
    private readonly logger: CustomLogger,
    private readonly http_service: HttpService,
    private readonly async_storage_service: AsyncStorageService,
    private readonly config: ConfigService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  private async handleApiCall(
    correlation_id: string,
    method: string,
    url: string,
    config: AxiosRequestConfig = {},
    req_body?: Object,
  ) {
    this.logger.verbose(correlation_id, 'Start');

    const x_finmo_ref =
      this.async_storage_service.get('x-finmo-ref') ||
      this.config.get('X_FINMO_REF');
    if (!!x_finmo_ref) {
      config = lodash.merge(
        { headers: { 'x-finmo-ref': x_finmo_ref } },
        config,
      );
    }

    if (!!config && !!config['headers']) {
      delete config['headers'].host;
      delete config['headers']['content-length'];
    }
    config = lodash.merge(
      { headers: { 'x-correlation-id': correlation_id } },
      config,
    );

    const request = {
      url: url,
      headers: !!config['headers'] ? config['headers'] : {},
      body: req_body,
    };
    this.logger.verbose(correlation_id, `Request: ${JSON.stringify(request)}`);

    let resp;
    try {
      switch (method.toUpperCase()) {
        case 'GET': {
          resp = await lastValueFrom(this.http_service.get(url, config));
          break;
        }
        case 'POST': {
          resp = await lastValueFrom(
            this.http_service.post(url, req_body, config),
          );
          break;
        }
        case 'PATCH': {
          resp = await lastValueFrom(
            this.http_service.patch(url, req_body, config),
          );
          break;
        }
        case 'PUT': {
          resp = await lastValueFrom(
            this.http_service.put(url, req_body, config),
          );
          break;
        }
        case 'DELETE': {
          resp = await lastValueFrom(this.http_service.delete(url, config));
          break;
        }
      }
    } catch (err) {
      this.logger.error(
        correlation_id,
        `status : ${err?.response?.status}, data: ${JSON.stringify(
          err?.response?.data,
        )} header: ${JSON.stringify(err?.response?.headers)}`,
      );
      throw err;
    }

    const { status, statusText, headers, data } = resp;
    const response = {
      status,
      statusText,
      headers,
      data,
    };

    this.logger.verbose(
      correlation_id,
      `Response: ${JSON.stringify(response)}`,
    );
    this.logger.verbose(correlation_id, 'End');

    return resp;
  }

  async get(correlation_id: string, url: string, config?: AxiosRequestConfig) {
    const response = await this.handleApiCall(
      correlation_id,
      'GET',
      url,
      config,
    );
    return response;
  }

  async post(
    correlation_id: string,
    url: string,
    req_body: Object,
    config?: AxiosRequestConfig,
  ) {
    const response = await this.handleApiCall(
      correlation_id,
      'POST',
      url,
      config,
      req_body,
    );
    return response;
  }

  async put(
    correlation_id: string,
    url: string,
    req_body: Object,
    config?: AxiosRequestConfig,
  ) {
    const response = await this.handleApiCall(
      correlation_id,
      'PUT',
      url,
      config,
      req_body,
    );
    return response;
  }

  async patch(
    correlation_id: string,
    url: string,
    req_body: Object,
    config?: AxiosRequestConfig,
  ) {
    const response = await this.handleApiCall(
      correlation_id,
      'PATCH',
      url,
      config,
      req_body,
    );
    return response;
  }

  async delete(
    correlation_id: string,
    url: string,
    config?: AxiosRequestConfig,
  ) {
    const response = await this.handleApiCall(
      correlation_id,
      'DELETE',
      url,
      config,
    );
    return response;
  }
}
