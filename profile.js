var userId;

const userTransactionQuery = `
                query GetTransactionData($userId: Int!) {
                  transaction(where: { _and: [{ userId: { _eq: $userId } }, { type: { _eq: "xp" } }] }) {                    id
                    type
                    amount
                    objectId
                    userId
                    createdAt
                    path
                  }
                }`;

const userProgressQuery = `
                query GetUserProgress($userId: Int!) {
                  progress(where: { userId: { _eq: $userId }, object: { type: { _eq: "project" } } }) {
                    id
                    userId
                    objectId
                    grade
                    createdAt
                    updatedAt
                    object {
                      id
                      name
                      type
                      attrs
                    }
                  }
                }`;

const userResultQuery = `
                query GetUserResult($userId: Int!) {
                  result(where: { userId: { _eq: $userId } }) {
                    id
                    userId
                    objectId
                    grade
                    createdAt
                    updatedAt
                  }
                }`;

const objectQuery = `
              query GetObjectsData($objectIds: [Int!]!) {
                object(where: { id: { _in: $objectIds } }) {
                  id
                  name
                  type
                  attrs
                }
              }`;


const userDetailsQuery = `
       query GetUser($userId: Int!) {
            user {
                id
                login
                totalUp
                totalDown
             	auditRatio
            }
            event_user(where: { userId: { _eq: $userId }, eventId:{_eq:20}}){
                level
          		userAuditRatio
            }
        }`;

const user = `
        query {
            user {
                id
                login
            }
        }
    `;

const userSkillsQuery = `
        query test($userId: Int) {
          user(where: {id: {_eq: $userId}}) {
            transactions(
              order_by: [{type: desc}, {amount: desc}]
              distinct_on: [type]
              where: {userId: {_eq: $userId}, type: {_in: ["skill_js", "skill_go", "skill_html", "skill_prog", "skill_front-end", "skill_back-end"]}}
            ) {
              type
              amount
            }
          }
        }
  `;


// document.getElementById('logoutForm').addEventListener('click', function () {
//     localStorage.removeItem('jwtToken');
//     window.location.href = 'index.html';
// });

async function start() {
    try {
        const user = await getUser(); // Wait for getUser function to resolve
        userId = user.id;
        const transcation = await fetchData(userTransactionQuery);
        const progress = await fetchData(userProgressQuery);
        const result = await fetchData(userResultQuery);
        const userData = await fetchData(userDetailsQuery);

        console.log(transcation);
        console.log(progress);
        console.log(result);

        // Call the function to display user information
        displayUserInfo(userData);

    } catch (error) {
        console.error('GraphQL Error:', error);
    }
}

start();

async function getUser() {
    try {
        const response = await fetch('https://learn.reboot01.com/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: `
                    query {
                        user {
                            id
                            login
                        }
                    }
                `
            }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        if (data.errors) {
            console.error(data.errors);
            return;
        }

        if (data.data.user.length === 0) {
            console.log("No user found");
            return;
        }

        return data.data.user[0];
    } catch (error) {
        console.error('GraphQL Error:', error);
    }
}


async function fetchData(query) {
    const variables = { userId };
    try {
        const response = await fetch('https://learn.reboot01.com/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query,
                variables
            }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        if (data.errors) {
            console.error(data.errors);
            if (data.errors[0].message === "Could not verify JWT: JWTExpired") {
                localStorage.removeItem('hasura-jwt');
                window.location.href = 'index.html';
            }
            return;
        }

        return data.data;
    } catch (error) {
        console.error('GraphQL Error:', error);
    }
}

// Function to display user information in a div
function displayUserInfo(data) {
    const userInfoDiv = document.getElementById('user-info');
    userInfoDiv.innerHTML = `
    <table>
        <tr>
            <td>User ID:</td>
            <td>Login:</td>
            <td>Total Up:</td>
            <td>Total Down:</td>
            <td>Audit Ratio:</td>
            <td>Level:</td>
        </tr>
        <tr>
            <td>${data.user[0].id}</td>
            <td>${data.user[0].login}</td>
            <td>${data.user[0].totalUp}</td>
            <td>${data.user[0].totalDown}</td>
            <td>${data.user[0].auditRatio}</td>
            <td>${data.event_user[0].level}</td>
        </tr>
    </table>
    `;
}

// Mock data received from the GraphQL query
const transactionData = {
    transaction: [
        {
            id: 1,
            type: "xp",
            amount: 50,
            objectId: 123,
            userId: 1,
            createdAt: "2024-08-23",
            path: "/path/to/project"
        },
        {
            id: 2,
            type: "xp",
            amount: 75,
            objectId: 456,
            userId: 1,
            createdAt: "2024-08-24",
            path: "/path/to/another/project"
        }
    ]
};

// Calculate the scaling factor for the bars
const scaleFactor = 2;

// Update the bar heights based on the data
document.querySelectorAll('.bar').forEach((bar, index) => {
    bar.setAttribute('height', transactionData.transaction[index].amount * scaleFactor);
    bar.setAttribute('y', 120 - transactionData.transaction[index].amount * scaleFactor);
    bar.nextElementSibling.setAttribute('y', 120 - transactionData.transaction[index].amount * scaleFactor - 5);
    bar.nextElementSibling.textContent = transactionData.transaction[index].amount;
});