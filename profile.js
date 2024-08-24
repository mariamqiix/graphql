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

const userTransactionUpQuery = `
                query GetTransactionData($userId: Int!) {
                  transaction(where: { _and: [{ userId: { _eq: $userId } }, { type: { _eq: "down" } }] }) {                    id
                    type
                    amount
                    objectId
                    userId
                    createdAt
                    path
                  }
                }`;

const userTransactionDownQuery = `
                query GetTransactionData($userId: Int!) {
                  transaction(where: { _and: [{ userId: { _eq: $userId } }, { type: { _eq: "up" } }] }) {                    id
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

async function start() {
    try {
        const user = await getUser(); // Wait for getUser function to resolve
        userId = user.id;
        const transactionUpData = await fetchData(userTransactionUpQuery);
        const transactionDownData = await fetchData(userTransactionDownQuery);
        const progress = await fetchData(userProgressQuery);
        const result = await fetchData(userResultQuery);
        const userData = await fetchData(userDetailsQuery);
        // Call the function to display user information
        addAuditRatio(userData, transactionUpData.transaction, transactionDownData.transaction);
        PieChart(generateSlices(createPathObject(transactionUpData.transaction)));
        const username = userData.user[0].login;
        const level = userData.event_user[0].level;
        console.log(userData);
        document.getElementById("userName").innerHTML = username;
        document.getElementById("level").innerHTML = level;
    } catch (error) {
        console.error("GraphQL Error:", error);
    }
}

start();

async function getUser() {
    try {
        const response = await fetch("https://learn.reboot01.com/api/graphql-engine/v1/graphql", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: `
                    query {
                        user {
                            id
                            login
                        }
                    }
                `,
            }),
        });

        if (!response.ok) {
            throw new Error("Network response was not ok");
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
        console.error("GraphQL Error:", error);
    }
}

async function fetchData(query) {
    const variables = { userId };
    try {
        const response = await fetch("https://learn.reboot01.com/api/graphql-engine/v1/graphql", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query,
                variables,
            }),
        });

        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        const data = await response.json();

        if (data.errors) {
            console.error(data.errors);
            if (data.errors[0].message === "Could not verify JWT: JWTExpired") {
                localStorage.removeItem("hasura-jwt");
                window.location.href = "index.html";
            }
            return;
        }

        return data.data;
    } catch (error) {
        console.error("GraphQL Error:", error);
    }
}

/// to create teh pie chart

const svgElement = document.getElementById("pieChart");

function interpolateColor(color1, color2, factor) {
    const hexToRgb = (hex) => {
        const bigint = parseInt(hex.slice(1), 16);
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    };

    const rgbToHex = (r, g, b) => {
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    };

    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    const resultRgb = rgb1.map((val, i) => Math.round(val + factor * (rgb2[i] - val)));
    return rgbToHex(...resultRgb);
}

function generateSlices(data) {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    const colorStops = ["#050152", "#340979", "#00d4ff"];
    const slices = [];

    Object.entries(data).forEach(([path, value], index) => {
        const ratio = value / total;
        const factor = index / (Object.keys(data).length - 1);

        const color1 = colorStops[Math.floor(factor * (colorStops.length - 1))];
        const color2 = colorStops[Math.ceil(factor * (colorStops.length - 1))];
        const colorFactor = (factor * (colorStops.length - 1)) % 1;
        const color = interpolateColor(color1, color2, colorFactor);
        slices.push({ path, ratio, color });
    });

    return slices;
}

function createPathObject(transactionData) {
    const pathCount = {};
    transactionData.forEach((transaction) => {
        const path = transaction.path;
        if (pathCount[path]) {
            pathCount[path] += 1;
        } else {
            pathCount[path] = 1;
        }
    });

    return pathCount;
}

function calculatePieSlicePath(cx, cy, radius, startAngle, ratio) {
    const endAngle = startAngle + ratio * 360;
    const startRad = (Math.PI / 180) * startAngle;
    const endRad = (Math.PI / 180) * endAngle;
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArcFlag = ratio > 0.5 ? 1 : 0;
    const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    return pathData;
}
const tooltip = document.getElementById("tooltip");

function appendPathToSVG(svgElement, pathData, fillColor, pathId) {
    const newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    newPath.setAttribute("d", pathData);
    newPath.setAttribute("fill", fillColor);
    newPath.setAttribute("id", pathId);
    svgElement.appendChild(newPath);

    // Adding event listeners to the newly created path
    newPath.addEventListener("mouseenter", () => {
        tooltip.style.display = "block";
        tooltip.textContent = newPath.id;
    });

    newPath.addEventListener("mousemove", (event) => {
        // Calculate tooltip position relative to pieChartDiv
        const pieChartRect = svgElement.getBoundingClientRect();
        const tooltipX = event.clientX - pieChartRect.left;
        const tooltipY = event.clientY - pieChartRect.top;

        tooltip.style.left = `${tooltipX}px`;
        tooltip.style.top = `${tooltipY + 10}px`; // Slight offset below the cursor
    });

    newPath.addEventListener("mouseleave", () => {
        tooltip.style.display = "none";
    });
}

function PieChart(slices) {
    // Initialize SVG and add slices
    const svgElement = document.getElementById("pieChart");
    const cx = 0; // Center x
    const cy = 0; // Center y
    const radius = 100; // Radius of the pie
    let startAngle = 0; // Starting angle in degrees
    // Loop through slices and append paths
    slices.forEach((slice) => {
        const pathData = calculatePieSlicePath(cx, cy, radius, startAngle, slice.ratio);
        appendPathToSVG(svgElement, pathData, slice.color, slice.path);
        startAngle += slice.ratio * 360; // Update start angle for next slice
    });
}

/// end of the pie chart decleration

//// audit ratio bar

function addAuditRatio(userData, transactionUpData, transactionDownData) {
    const auditRatio = userData.user[0].auditRatio;

    // Calculate total amount for transactionUpData
    const totalUpAmount = transactionUpData.reduce((accumulator, transaction) => {
        return accumulator + transaction.amount;
    }, 0);

    // Calculate total amount for transactionDownData
    const totalDownAmount = transactionDownData.reduce((accumulator, transaction) => {
        return accumulator + transaction.amount;
    }, 0);

    document.getElementById("doneValue").innerHTML = formatToBillions(totalDownAmount);
    document.getElementById("receivedValue").innerHTML = formatToBillions(totalDownAmount);
    document.getElementById("userRatio").innerHTML = auditRatio.toFixed(1);

    if (auditRatio.toFixed(1) < 1) {
        document.getElementById("userMessage").innerHTML = "you are so bad";
    } else if (auditRatio.toFixed(1) === 1) {
        document.getElementById("userMessage").innerHTML = "nice work";
    } else {
        document.getElementById("userMessage").innerHTML = "يابن المحظوظة";
    }
    // Optionally calculate a combined ratio or any other metric as needed
    console.log("Total Done:", formatToBillions(totalDownAmount));
    console.log("Total Received:", formatToBillions(totalUpAmount));
    console.log("Combined Audit Ratio:", auditRatio.toFixed(1));
}

// Helper function to format numbers to billions with two decimal places
function formatToBillions(amount) {
    const billion = 1e6;
    const roundedAmount = (amount / billion).toFixed(2);
    return `${roundedAmount} MB`;
}