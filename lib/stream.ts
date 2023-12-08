export class ThroughStream<T> extends TransformStream<T, T> {
    constructor() {
        super({
            async transform(chunk, controller) {
                controller.enqueue(chunk)
            }
        })
    }
}