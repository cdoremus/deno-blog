#### 2022-10-30

# Using Preact Signals with Fresh

[Fresh](https://fresh.deno.dev) is the Deno full-stack framework created by [Luca Casonato](https://github.com/lucacasonato) of the Deno core team and now [hosted in the Deno github repository](https://github.com/denoland/fresh).

Fresh makes it easy to create web sites that have mostly static content like this blog that was created with Fresh. By default the Fresh server does not ship any JavaScript to the front end. But you can use client-side JavaScript by putting components in an `islands` folder.

Fresh uses [Preact](https://preactjs.com) under the covers. Preact is a lightweight version of [React](https://reactjs.org) that uses components and other React functionality (like context and hooks). So it is easy for a React developer to migrate to Preact.

Recently the Preact team has released a new library called [Signals](https://preactjs.com/blog/introducing-signals/) for reactive state management. This post will demonstrate how to use Signals with Fresh.

## Using Signals for State Management

Probably the best use of Signals is for state management. It can be used for both global or local state management, but each uses a different function.

I created a basic Fresh Todo app the illustrate the use of Signals. The source code can be found [in this Github repo](https://github.com/cdoremus/fresh-todo-signals).

## Global State Management

## Setup

As of Fresh version 1.1, when you [create a new fresh project](https://fresh.deno.dev/docs/getting-started/create-a-project) the signals libraries are automatically added to the import map.
If you are updating a Fresh project to use Signals, then add the following lines to the `import` section in your import map file:
```json
    "@preact/signals": "https://esm.sh/*@preact/signals@1.0.3",
    "@preact/signals-core": "https://esm.sh/*@preact/signals-core@1.0.1"

```

## Encapsulating state in a single file

The todo app encapsulates global state management in a single file called [state.ts](https://github.com/cdoremus/fresh-todo-signals/blob/main/state.ts) inside a function called `createAppState`. The `signal` function is used to add a field to global state:
```ts
function createAppState(): AppStateType {
  const todos = signal<string[]>([]);
  const currentTodo = signal<string>("");
```
In this case, the current todo (`currentTodo`) and a todos array (`todos`) are held in global state. Functions to update the signals are also contained in `createAppState` and made available to other modules in the app in the function's return value.
```ts
function createAppState(): AppStateType {
  // ... Signals here ...

  const addTodo: AddTodoFunction = (e: Event): void => {
    e.preventDefault();
    todos.value = [...todos.value, currentTodo.value];
    currentTodo.value = "";
  };

  const removeTodo: RemoveTodoFunction = (index: number): void => {
    todos.value = todos.value.filter((_todo: unknown, i: number) =>
      i !== index
    );
  };
  return { todos, currentTodo, addTodo, removeTodo, todoCount };
}
```

The `signal` function's argument is the initial value of the Signal. This value is held in a `value` field of the signal. To get the current todo's value, you need to use the expression  `currentTodo.value`.

We will be using the `createAppState` function to pass signals and functions to the app's components. Ths done through the Preact
Context (similar to React Context). Application state -- including the signals previously created -- is added to the context in the root component `App` (in `App.tsx`) using a context provider:
```ts
import { createContext } from "preact";
import state, { type AppStateType } from "../state.ts";

export const AppState = createContext<AppStateType>({} as AppStateType);

export default function App() {
  return (
      <AppState.Provider value={state}>
      // Components that use the state here ...
      <AppState.Provider>
  );
}
```
The `state` field is the return value of the `createAppState` function in `state.ts`. `AppState.Provider` is a Preact Context provider.

The state held in the context can be accessed by any of the app's components with the `useContext` function. Here it is used by the `TodoList` component to access the list of todos:

```ts
import { useContext } from "preact/hooks";
import { AppState } from "./App.tsx";
import Todo from "./Todo.tsx"

export default function TodoList() {
  // Destructure state to expose the todos signal
  const { todos } = useContext(AppState);
  return (
    <div className="todos">
    //
      {todos.value?.map((item: string, i: number) => {
        return (
          <Todo text={item} index={i} />
        );
      })}
    </div>
  );
}
```
The `value` property of a signal contains the signal's value. I've made the mistake of not doing that and wondering what happened to the data in I put in the signal.
The `value` property of a signal can also be used to set the value of a signal. This is done in the `addTodo` and `removeTodo` functions in `createAppState` in `state.ts`. This mutation is encapsulated in these functions, but the same thing can be done outside the app state object. This is what is done in the  `onChange` handler in `AddTodo.tsx`:
```ts
    onChange={(e) =>
      currentTodo.value = (e.target as HTMLInputElement).value}
```
Note that the type coercion of the event target is needed because of a [bug](https://github.com/preactjs/preact/issues/1930) in the current Preact TypeScript typings.

The `value` property of a signal can also be used to set the value of a signal. This is done in the `addTodo` and `removeTodo` functions in `createAppState` in `state.ts`. This mutation is encapsulated in these functions, but the same thing can be done outside the app state object. This is what is done in the  `onChange` handler in `AddTodo.tsx`:
```ts
    onChange={(e) =>
      currentTodo.value = (e.target as HTMLInputElement).value}
```
Note that the type coercion of the event target is needed because of a [bug](https://github.com/preactjs/preact/issues/1930) in the current Preact TypeScript typings.


# computed()


## The effect function
- gets notified of signal updates
- does not have a dependency array
- return value is a function that cleans
up the effect
  - documentation recommends calling the cleanup function after it is used to free up memory
    - if effect is used in a component, you can have a useEffect return function that cleans calls the cleanup function

# Local state with Signals

## The batch and peek functions

## The batch function
- a performance optimization
- used to batch updates to multiple signals


