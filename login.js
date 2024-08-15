// Example usage
const apiUrl = 'https://learn.reboot01.com/api/auth/signin';
var userID;

document.getElementById("loginForm").addEventListener("submit", function (event) {
    event.preventDefault();
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;


    makePostRequestWithBasicAuth(apiUrl, username, password)
        .then(data => {
            localStorage.setItem('jwtToken', data);
            document.getElementById("message").innerText = "Login successful!";
            userID = getUser();
            window.location.href = "profile.html";
        })
        .catch(error => {
            document.getElementById("message").innerText = "Invalid username or password. Please try again.";
        });
    
});

document.getElementById('logoutForm').addEventListener('click', function () {
    localStorage.removeItem('jwtToken');
    window.location.href = 'index.html';
});


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

        return data.data;
    } catch (error) {
        console.error('GraphQL Error:', error);
    }
}


async function getTransaction() {
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
                        transaction {
                            id
                            type
                            amount
                            objectId
                            userId
                            createdAt
                            path
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

        return data.data;
    } catch (error) {
        console.error('GraphQL Error:', error);
    }
}
