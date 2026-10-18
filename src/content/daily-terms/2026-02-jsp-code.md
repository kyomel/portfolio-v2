---
title: "JSP Code"
termSlug: "jsp-code"
year: 2026
month: 2
monthName: "February"
day: 19
order: 14
source: "2026/feb-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/feb-term.md"
excerpt: "JSP Code (JavaServer Pages Code) refers to the programming elements embedded within JSP files that enable dynamic content generation on web servers. It combines HTML markup with Java code snippets..."
---
### Definition:

JSP Code (JavaServer Pages Code) refers to the programming elements embedded within JSP files that enable dynamic content generation on web servers. It combines HTML markup with Java code snippets to create interactive web pages that can access databases, process user input, and generate customized responses.

JSP code is written in .jsp files and gets compiled into servlets by the web container (like Tomcat) before execution.

**Core Components of JSP Code**

```text
┌──────────────────────────────────────────────────┐
│ JSP File Structure │
├──────────────────────────────────────────────────┤
│ │
│ HTML Markup Static content │
│ ├─ <html>, <body>, etc. │
│ │
│ Scriptlets Java code blocks │
│ ├─ <% ... %> Execute logic │
│ │
│ Expressions Output values │
│ ├─ <%= ... %> Print to page │
│ │
│ Declarations Define variables/methods │
│ ├─ <%! ... %> Class-level code │
│ │
│ Directives Page configuration │
│ ├─ <%@ ... %> Imports, settings │
│ │
│ Actions Predefined tags │
│ └─ <jsp:include> Standard operations │
│ │
└──────────────────────────────────────────────────┘
```

### Example:

Simple User Greeting Page

```
Complete JSP File: welcome.jsp

<%@ page language="java" contentType="text/html; charset=UTF-8" %>
<%@ page import="java.util.Date, java.text.SimpleDateFormat" %>

<!DOCTYPE html>
<html>
<head>
    <title>Welcome Page</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .greeting { color: #2c3e50; font-size: 24px; }
        .info { color: #7f8c8d; margin-top: 20px; }
    </style>
</head>
<body>

<%-- JSP Comment: This won't appear in HTML source --%>

<%
    // SCRIPTLET: Get user information from request
    String name = request.getParameter("username");
    String timeOfDay = "";

    // Determine time of day
    int hour = java.time.LocalTime.now().getHour();
    if (hour < 12) {
        timeOfDay = "Good Morning";
    } else if (hour < 18) {
        timeOfDay = "Good Afternoon";
    } else {
        timeOfDay = "Good Evening";
    }

    // Default name if not provided
    if (name == null || name.trim().isEmpty()) {
        name = "Guest";
    }
%>

<!-- Using EXPRESSIONS to output data -->
<div class="greeting">
    <h1><%= timeOfDay %>, <%= name %>! 👋</h1>
</div>

<div class="info">
    <p>Current Date: <%= new SimpleDateFormat("EEEE, MMMM dd, yyyy").format(new Date()) %></p>
    <p>Current Time: <%= new SimpleDateFormat("hh:mm:ss a").format(new Date()) %></p>
    <p>Your IP Address: <%= request.getRemoteAddr() %></p>
    <p>Session ID: <%= session.getId() %></p>
</div>

<%
    // SCRIPTLET: Log the visit
    System.out.println("User " + name + " visited at " + new Date());
%>

</body>
</html>
How to Access This Page

URL: http://localhost:8080/welcome.jsp?username=Alice

Output in Browser:
─────────────────────────────────────
Good Afternoon, Alice! 👋

Current Date: Monday, February 19, 2026
Current Time: 02:30:45 PM
Your IP Address: 192.168.1.100
Session ID: A3F2E9B1C4D8E7F6
─────────────────────────────────────
```
