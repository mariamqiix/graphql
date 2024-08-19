// Example usage
const apiUrl = 'https://learn.reboot01.com/api/auth/signin';
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

document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    try {
        let data = await makePostRequestWithBasicAuth(apiUrl, 'rhelal', 'Ruq@1680');
        localStorage.setItem('jwtToken', data);
        document.getElementById("message").innerText = "Login successful!";
        
        const user = await getUser(); // Wait for getUser function to resolve
        userId = user.id;
        const transcation = await fetchData(userTransactionQuery);
        console.log(transcation);
        
        // If you want to redirect after getting userId, uncomment the following line
        // window.location.href = "profile.html";
    } catch (error) {
        document.getElementById("message").innerText = "Invalid username or password. Please try again.";
    }

});


// document.getElementById('logoutForm').addEventListener('click', function () {
//     localStorage.removeItem('jwtToken');
//     window.location.href = 'index.html';
// });


// Function to make a POST request with Basic Authentication
async function makePostRequestWithBasicAuth(url, username, password) {
    const credentials = `${username}:${password}`;
    const base64Credentials = btoa(credentials);

    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${base64Credentials}`
        },
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .catch(error => {
            throw new Error('Error:', error);
        });
}

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
