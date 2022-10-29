#### 2022-10-31

# Using Preact Signals with Fresh

[Fresh](https://fresh.deno.dev) is the Deno full-stack framework created by [Luca Casonato](https://github.com/lucacasonato) of the Deno core team and now [hosted in the Deno github repository](https://github.com/denoland/fresh).

Fresh makes it easy to create web sites that have mostly static content like this blog that was built with Fresh. By default the Fresh server does not ship any JavaScript to the front end. But you can use client-side JavaScript by putting components in an `islands` folder.

Fresh uses [Preact](https://preactjs.com) under the covers. Preact is a lightweight version of [React](https://reactjs.org) that uses components and other React functionality (like context and hooks). So it is easy for a React developer to migrate to Preact.

Recently the Preact team has released a new library called [Signals](https://preactjs.com/blog/introducing-signals/) for reactive state management. This post will demonstrate how to use Signals with Fresh.

## Using Signals for State Management

Probably the best use of Preact Signals is for state management. It can be used for both global or local state management, but each is done differently.


I created a basic Fresh Todo app to illustrate the use of Preact Signals. The source code can be found [in this Github repo](https://github.com/cdoremus/fresh-todo-signals).

## Global State Management

## Setup

As of Fresh version 1.1, when you [create a new fresh project](https://fresh.deno.dev/docs/getting-started/create-a-project) the signals libraries are automatically added to the import map file.
If you are updating a Fresh project to use Signals, then add the following lines to the `import` section in your import map:
```json
    "@preact/signals": "https://esm.sh/*@preact/signals@1.0.3",
    "@preact/signals-core": "https://esm.sh/*@preact/signals-core@1.0.1"

```

## Creating global state

The todo app encapsulates global state management inside a function called `createAppState` (in [state.ts](https://github.com/cdoremus/fresh-todo-signals/blob/main/state.ts)). The `signal` function is used to add a field to global state:
```ts
function createAppState(): AppStateType {
  const todos = signal<string[]>([]);
  const currentTodo = signal<string>("");
```
In this case, the current todo (`currentTodo`) and a todos array (`todos`) are held in global state. Each call to the `signal` function takes an object or primitive argument that represents the initial state value.

Functions to update the state are also contained in `createAppState` and made available to other modules in the app in the return value of that function.
```ts
function createAppState(): AppStateType {
  // ... todos and current todos signals created here ...

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

We will be using the `createAppState` function to pass signals and functions to the app's components. Ths done through the Preact
Context (similar to React Context). Application state -- including the signals previously created -- is added to the context in the root component `App` (`App.tsx`) using a context provider:
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
The `state` field in the `App` module is the return value of the `createAppState`. `AppState.Provider` is a Preact Context provider.

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
    // use the value property to obtain the todos array
      {todos.value?.map((item: string, i: number) => {
        return (
          <Todo text={item} index={i} />
        );
      })}
    </div>
  );
}
```
The object returned from a call to `signal` contains a `value` field which is the current value of the signal. In the Todo app there are signals for all todos (`todos`, an array of strings) and the current todo (`currentTodo`, a string). The value of `todos` is obtained from this expression: `todos.value`.

The `value` property can also be used to set the value of a signal. There is no built-in setter like there is in local state obtained from a call to the `useState` hook. This signal value mutation is done in the `addTodo` and `removeTodo` functions. The same thing can be done outside the app state object. This is what is done in the `onChange` handler in `AddTodo.tsx`:
```ts
    onChange={(e) =>
      currentTodo.value = (e.target as HTMLInputElement).value}
```
Note that the type coercion of the event target is needed because of a [bug](https://github.com/preactjs/preact/issues/1930) in the current Preact TypeScript typings.


## Using the computed function
The function `computed` is included in the Preact Signals module. It is designed to be used to derive values based on the value of one or more signals. An example is found in the `createAppState` function in `state.ts`:
```ts
  const todoCount = computed(() => todos.value.length);
```
When `todos.value` changes, the callback function gets re-run and the `todoCount` gets updated with the new count.

## The effect function
Another function in the Signals module is `effect`. Like `useEffect`, this function is used for side effects. Like `computed, `effect` gets notified of any change in signals that are contained in the function and when that happens, the callback function is re-run. The Todo app contains a trivial implementation:
```ts
  const dispose: () => void = effect(() => {
    console.log(`Todo '${currentTodo.value}' added`);
  });
```
The `effect` function does not have a dependency array since it is autmatically re-run when a contained signal changes.

The return value of `effect` is a function (`dispose` in this case) that can be used to free up the memory used by `effect` when it is no longer used. In this case, the `dispose` function is needed throughout the lifetime of an instance of the Todo app.

If you are using `effect` in a local component, you can call the `dispose` function in the return function of `useEffect` like this:
```ts
useEffect(() => {
    return () => {
      // returned function automatically runs
      // when the component is unmounted
      dispose();
    };
  }, []);
  ```

# Local state with Signals

## The batch and peek functions

## The batch function
- a performance optimization
- used to batch updates to multiple signals


