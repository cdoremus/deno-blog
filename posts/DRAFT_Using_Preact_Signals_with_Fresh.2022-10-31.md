#### 2022-10-31

# Using Preact Signals with Fresh

[Fresh](https://fresh.deno.dev) is the Deno full-stack framework created by [Luca Casonato](https://github.com/lucacasonato) of the Deno core team and now [hosted in the Deno github repository](https://github.com/denoland/fresh).

Fresh makes it easy to create web sites that have mostly static content like this blog (built with Fresh). This blog post assume you have some familiarity with Fresh. If not, see the [Fresh documentation](https://fresh.deno.dev/docs/introduction) to get up to speed.

Fresh uses [Preact](https://preactjs.com) under the covers. Preact is a lightweight version of [React](https://reactjs.org) that uses components and other React functionality (like context and hooks), so it is easy for a React developer to migrate to Preact.

Recently the Preact team has released a new library called [Signals](https://preactjs.com/blog/introducing-signals/) for reactive state management. This post will demonstrate how to use Signals with Fresh.

## Using Signals for State Management

Preact Signals are used for both global and local state management.

I created a basic Fresh Todo app to illustrate the use of Preact Signals. The source code can be found [in this Github repo](https://github.com/cdoremus/fresh-todo-signals).

## Global State Management

### Setup

As of Fresh version 1.1, when you [create a new fresh project](https://fresh.deno.dev/docs/getting-started/create-a-project) the signals libraries are automatically added to the import map file.
If you are updating a Fresh project to use Signals, then add the following lines to the `imports` section in your import map:
```json
{
  "imports": {
    # other imports here
    "@preact/signals": "https://esm.sh/*@preact/signals@1.0.3",
    "@preact/signals-core": "https://esm.sh/*@preact/signals-core@1.0.1"
  }
}
```

## Creating global state

The todo app encapsulates global state management inside a function called `createAppState` (in [`state.ts`](https://github.com/cdoremus/fresh-todo-signals/blob/main/state.ts)). The `signal` function is used to add a field to global state:
```ts
function createAppState(): AppStateType {
  const todos = signal<string[]>([]);
  const currentTodo = signal<string>("");
  // other stuff here...
  return {todos, currentTodo, /* Other function properties here...*/}
}
// function return value is the default export
export default createAppState();
```
In this case, the current todo (`currentTodo`) and a todos array (`todos`) are held in global state returned by `createAppState`. Each call to the `signal` function takes an object or primitive argument that represents the initial value of that signal.

Functions that update the state are also contained in `createAppState` (`addTodo` and `removeTodo`) and made available to other modules in the return value of that function (also note the TypeScript type `AppStateType` defined in [state.ts](https://github.com/cdoremus/fresh-todo-signals/blob/main/state.ts)).
```ts
function createAppState(): AppStateType {
  // ... todos, current todos signals created here  as is todoCount ...

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
  return { todos, currentTodo, addTodo, removeTodo, todoCount /* todoCount explained below */ };
}
export default createAppState();
```

We will be using the `createAppState` function to pass signals and functions to the app's components. Ths done through the Preact
Context (similar to React Context). Application state -- including the signals previously created -- is added to the context in the root component `App` (see [`App.tsx`](https://github.com/cdoremus/fresh-todo-signals/blob/main/islands/App.tsx)) using a context provider:
```ts
import { createContext } from "preact";
import state, { type AppStateType } from "../state.ts";

// create the AppState context
export const AppState = createContext<AppStateType>({} as AppStateType);

export default function App() {
  return (
      <AppState.Provider value={state}>
      // Components that use the state here ...
      <AppState.Provider>
  );
}
```
The `state` field in the `App` module is the return value of the `createAppState` function (see [`state.ts`](https://github.com/cdoremus/fresh-todo-signals/blob/main/state.ts)). `AppState.Provider` is a Preact context provider which exposes `state` to the rest of the app enclosed within its component tree.

The `state` held in the context can be accessed by any of the app's components with the `useContext` function. Here it is used by the `TodoList` component to access the list of todos:

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
### A Signal's value
The object returned from a call to `signal` in `createAppState` contains a `value` field which is the current value of the signal. In the Todo app there are signals for all todos (`todos`, an array of strings) and the current todo (`currentTodo`, a string). The value of `todos` is obtained from this expression: `todos.value`.

The `value` property can also be used to set the value of a signal. There is no built-in setter like there is in local state obtained from a call to the `useState` hook. This signal value mutation is done in the `addTodo` and `removeTodo` functions. The same thing can be done outside the app state object. This is what is done in the input's `onChange` handler in `AddTodo.tsx`:
```ts
  <input
    { /* other stuff missing here... */}
    onChange={(e) =>
      currentTodo.value = (e.target as HTMLInputElement).value}
  />
```
Note that the type coercion of the event target is needed because of a [bug](https://github.com/preactjs/preact/issues/1930) in the current Preact TypeScript typings.


### Using the computed function
The function `computed` is included in the Preact Signals module. Signals that are used within `computed` are subscribed to the signal and notified when the signal's value changes. That allows `computed` to derive values based on the value of one or more signals. When `computed` is notified of a signal value change, it automatically re-runs the function sent in as an argument. An example is found in the `createAppState` function in `state.ts`:
```ts
  const todoCount = computed(() => todos.value.length);
```
When `todos.value` changes, the callback function gets re-run and the `todoCount` gets updated with the new count.

### The effect function
Another function in the Signals module is `effect`. Like `useEffect`, this function is used for side effects. Like `computed`, `effect` is subscribed to any enclosing signals and notified of any change in a signals value, and when that happens, the callback function is re-run. The Todo app contains a trivial implementation:
```ts
  const dispose: () => void = effect(() => {
    console.log(`Todo '${currentTodo.value}' added`);
  });
```
The `effect` function does not have a dependency array since it is automatically re-run when a contained signal changes.

The return value of `effect` is a function (`dispose` in this case) that can be used to free memory used by `effect` when it is no longer needed. In this case, the `dispose` function is used throughout the lifetime of an instance of the Todo app, so `dispose` is not called.

If you are using `effect` in a local component, you can call the `dispose` function in the return function of `useEffect` like this:
```ts
useEffect(() => {
    return () => {
      // this function runs when
      // the component is unmounted
      dispose();
    };
  }, []);
  ```

## Local state with Signals

The use of local signals is illustrated with the ['Counter.tsx]() component.
The `Counter` component counts button clicks and stores the counts in local storage so the current count can be recovered when the page is reloaded. Preact Signals is used to hold local state in this component.

Using signals for local state requires use of the `useSignal` hook. There is also a `useComputed` function that can be used for local computed values. Both of these hooks are found in the `preact/signals` module.

This is how the `Counter` component holds component state:
```ts
export default function Counter() {
  const COUNT_KEY = "COUNT";
  const count = useSignal<number>(parseInt(localStorage.getItem(COUNT_KEY) ?? "0"));
  // other code here...
}
```
The count is stored in local storage, so when the count signal is instantiated using `useSignal`, it pulls the count from local storage if it exists. Note that `useSignal` is for local state, while `signal` is used for global state. Note that `useSignal` does not return a setter function like `useState`. The state value can be obtained from the signal (`count.value` in this case) and that value can be mutated directly as occurs in this button's `onClick` handler (in `Counter.tsx`):

```ts
  <button onClick={() => {
    count.value = 0;
    localStorage.setItem(COUNT_KEY, "0");
    }}>Reset Count</button>
```

The `useComputed` function is used for computing new values based on one or more signal's value. It is used for local state calculations, while `computed` is used for global state calculations. As with `computed`, the `useComputed` function argument is automatically re-run when a signal's value changes. In the case of the `Counter` component, `useComputed` is used to calculate the counter value squared. Any time that a signal changes, the `useComputed` function is re-run if it uses that signal (`count` in `Counter.tsx`).
```ts
  const square = useComputed(() => count.value * count.value);
```


### The effect function
The `effect` function in the `signals` module is used to handle side effects like `useEffect`. However, `effect` does not have a dependency array like `useEffect`. When a signal's value changes, the `effect` function is notified of that change. In `Counter`, the effect is used to update the count in local storage.
```ts
  const dispose = effect(() => {
      localStorage.setItem(COUNT_KEY, count.value.toString());
      console.log(`Double: ${square.value}`)
    });
  useEffect(() => {
    return () => {
      // free-up effect's memory
      dispose();
    };
  }, []);
```
The `effect` function returns a function (called `dispose` in this case) that can be used to invalidate the effect and free up memory that it uses. In this case we call `dispose` in the function returned by `useEffect` which gets called when the component is unloaded.

An `effect` can be nested inside another `effect`. Then you can make sure the signal only runs once like this:
```ts
// From Ryan Carniato stream: https://www.youtube.com/watch?v=QRtrS_SvR4w&t=10909s
let dispose;
effect(() => {
  // clean up signal after it runs once
  if (dispose) dispose();
  // outer side effect here
  dispose = effect(() => {
    // inner side effect here
  });
});
```
The `effect` function can be used to work with both global and local state.

## Other functions in the Signals module

### The batch function
The `batch` function is used to update multiple signals at a time for performance optimization. For instance, the todo array and current todo could be updated in this manner:
```ts
batch(() => {
  currentTodo.value = "Another thing I have to do";
  todos.value = todos.value.push(currentTodo.value)});
```

### The peek function
The `peek` function is attached to a signal's value. It is used to get the value of a signal without subscribing to the signal.


## Conclusion
This post shows how to use the Preact signals module with Deno Fresh. Snippets from the post's [source code](https://github.com/cdoremus/fresh-todo-signals) have been used here, so make sure you check it out to get a complete picture of how everything fits together.