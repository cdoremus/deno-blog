<!-- deno-fmt-ignore-file -->
#### 2023-11-18

##### _NN min read_

# Client-Server Communication in Deno Beyond the Usual HTTP Request-Response Channel

The most frequently used means to communicate between a client and server-side webapp is through HTTP where the client requests a URL and then receives a response containing markup or data. But there are other means to do it. This article will examine those, specifically polling, websockets, Server-Sent Events and BroadcastChannel. All three of these are standard APIs built into the Web Platform.


## Polling

Polling periodically pushes data or events from the server to the client. But it requires that the communication channel be reopened every time data is exchanged. Polling needs to be initiated and re-established by the client.

### Short polling vs long polling

Short and long polling are two ways of characterizing polling. They differ in the amount of time between polling requests.


## Websockets

The [Websocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) is a means for doing two-way communication between a web page and the server in real-time without the need for polling as the communication channel remains continuously open.

dfadfasdfas

## Server-Sent Events (SSE)

asdfasdfasdf

## BroadcastChannel

adfasdfsdf

## Conclusions

fadfadfadf