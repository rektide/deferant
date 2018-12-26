# Deferrant

> Non-dogmatic ultra-light Promise/defer implementation

Deferrant exists to provide a lower weight, more flexible to use alternative to `defer` and promise itself.

Deferrant is a Promise which exposes it's own `resolve` and `reject` methods as members. This provides an alternative to the semi-standard [Deferred](https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Promise.jsm/Deferred) implementation. Additionally, unlike most promises, Deferrant exposes it's state synchronously.

# Differences from promise & defer

Deferrant varies from promises in a number of key ways, usually by permitting the developer considerably more leeway with how they wish to work things.

## Non-dogmatic access to state

Promises can traditionally only have their state introspected asynchronously: this forms an inherent barrier to [unleashing Zalgo](http://blog.izs.me/post/59142742143/designing-apis-for-asynchrony), in that if one needs to read a value to compute, they are forced to either a) do so asynchronously, or b) cook up a bunch of hacks to store promise state in a sychronous shadow state holding structure they stew up.

The downside of this is that all code that may touch anything asynchronous more or less has to be asynchronous, and this frequently comes with an enormous performance penalty. Rather than being able to write a piece of code that functions synchronously and fast when given synchronous data, and functions asynchronously and slowly when given asychronous data, we either have to write the code twice & take care to explicitly invoke the right method, or we take the hit of being async each and every time.

Deferrant trusts you. It exposes it's current resolved/rejected state, and the resolved or rejected value.

```
const d= Deferrant()
d.resolve("believe")
console.log(d.resolved) //=> believe
```

```
const d= Deferrant()
d.reject("safe")
console.log(d.rejected) //=> safe
console.log(d.fulfilled? "choice": "black iron prison")
```

## Non-dogmatic delegation of responsibilities

Deferred's are regarded as "safe" because one can pass the promise without fear that the receiver might alter the behavior in unanticipated ways. It delegates that there is a separate promise, and a sepaarate fulfiller mechanism, and makes the two differentt.

Deferrant conjoins the two, halving the number of allocations required & reducing the number of objects one has to manage.

```
const d= Deferrant()
d.then(console.log) // deferrant is a promise
d.resolve("trust") // resolve called on the deferrant
//=> trust (as .then is fired)
```

If one wanted to create such a security barrier with Deferrant, one could wrap the deferrant in another promise: `const d= Deferrant(), promise= Promise.resolve(d)`.
