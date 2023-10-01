import { useState, useEffect } from "preact/hooks";
import { assertEquals, assertExists, assertFalse } from "std/assert/mod.ts";
import { cleanup, fireEvent, logRoles, render, setup, waitFor } from "$fresh-testing-library";
import { afterEach, beforeAll, describe, it } from "std/testing/bdd.ts";
import { resolve } from "$fresh/src/dev/deps.ts";

type User = {
  name: string;
}

const mockUsers: User[] = [
  {name: "User1"},
  {name: "User2"},
  {name: "User3"},
  {name: "User4"},
  {name: "User5"},
]
export function DisplayUsers() {
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => {
    async () => {
      const fetched = await fetchUsers((500));
      setUsers(fetched);
      };
  }, []);

//   async function fetchUsers(delay: number): Promise<User[]> {
//     return
//       setTimeout(() => [
//         await Promise;resolve(fetchMockUsers())
//       ]), delay);
//   }
// }

  const fetchMockUsers = () => mockUsers;

  function delayedFetch(url: string, delay: number) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        fetch(url)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP Error: ${response.status}`);
            }
            return response.json();
          })
          .then(data => resolve(data))
          .catch(error => reject(error));
      }, delay);
    });
  }

  // Usage example:
  // async function fetchDataWithDelay() {
  //   try {
  //     console.log('Fetching data with a 2-second delay...');
  //     const result = await delayedFetch('https://jsonplaceholder.typicode.com/todos/1', 2000);
  //     console.log('Data received:', result);
  //   } catch (error) {
  //     console.error('Error:', error);
  //   }
  // }

  // fetchDataWithDelay();



  const fetchUsers = (delay: number) => {
    console.log("fetchUsers Called with mock users!");
    let fetched: User[] = [];
    setTimeout(() => {
      async () => {
        fetched = await Promise.resolve(mockUsers);
      }
    }, delay);
    return fetched;
  }

  // const fetchUsers = async () => {
  //   console.log("fetchUsers Called!")
  //   const resp = await fetch('https://jsonplaceholder.typicode.com/users/')
  //   return await resp.json() as User[];
  // }

  // if (loading) {
  //   return <div role="note">Loading...</div>;
  // }
  return (
    <div>
      <div role="heading">Users</div>
      <ul>
        {
          users.map(user => {
            <li>{user.name}</li>
          })
        }
      </ul>
      {/* <button onClick={fetchUsers}>Fetch Users</button> */}
    </div>
  );
}


describe("Async tests", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should display fetched users", async () => {
    const { container, getByRole, getAllByRole } = render(<DisplayUsers/>);
    const button = getByRole("button", {name: "Fetch Users"});
    fireEvent.click(button);
    // let list = [];
    await waitFor( () => getAllByRole("listitem"), {timeout:2000});
    // const list = await screen.findAllByRole("listitem", {}, {timeout:1500});
    const list = getAllByRole("listitem");
    assertEquals(list.length, 10);
  });
});
