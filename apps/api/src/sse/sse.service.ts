import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { SSEEvent } from '@testa/shared';

@Injectable()
export class SseService {
  private streams = new Map<string, Subject<SSEEvent>>();

  create(executionId: string): void {
    if (!this.streams.has(executionId)) {
      this.streams.set(executionId, new Subject<SSEEvent>());
    }
  }

  getStream(executionId: string): Observable<SSEEvent> {
    if (!this.streams.has(executionId)) {
      this.create(executionId);
    }
    return this.streams.get(executionId)!.asObservable();
  }

  emit(executionId: string, event: SSEEvent): void {
    this.streams.get(executionId)?.next(event);
  }

  complete(executionId: string): void {
    this.streams.get(executionId)?.complete();
    this.streams.delete(executionId);
  }

  error(executionId: string, err: unknown): void {
    this.streams.get(executionId)?.error(err);
    this.streams.delete(executionId);
  }
}
