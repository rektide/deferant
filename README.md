# Deferrant

> A libre-maximale, radically-unsafe alternative to Promise.defer's Deferred.

Deferrant is a promise which is it's own [Deferred](https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Promise.jsm/Deferred) implementation, and which synchronously exposes it's state.

## Safe delegation of responsibilities

Deferred's are regarded as "safe" because one can pass the promise without fear that the receiver might alter the behavior in unanticipated ways.

Deferrant is created because letting software do things the original implementer never imagined is glorious and brilliant and bright & we ought accept & enable that kind of cavalier libre behavior. so Deferrant gives the author & the user the freedom of having resolve & reject right there, ready for anyone to use, anytime, however they see fit, hopefully in some semi-responsible manner, but, maybe, you know, not.

```
const d= Deferrant()
d.then(console.log) // deferrant is a promise
d.resolve("trust") // resolve called on the deferrant
//=> trust
```

# Safe access to state

Promises are "safe" because their state can only be introspected asynchronously: they posses this inherent barrier to [unleashing Zalgo](http://blog.izs.me/post/59142742143/designing-apis-for-asynchrony), in that if one needs to read a value to compute, they are forced to either a) do so asynchronously, or b) cook up a bunch of hacks to store promise state in a sychronous shadow state holding structure they stew up.

Deferrant is created to once again to trust that user & author are aware of or willing to encounter dangers, and want to do state read synchronously anyways or leave the possibility open to folk. Because we trust them, and they're smart people, and maybe the code just runs better or is easier to author that way.  Because if you want to check the state of a promise, you ought be able to. We trust you.

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
