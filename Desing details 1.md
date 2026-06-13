1. Miyame company needs a task tracker, that will help all the employees create to-do lists daily and those lists will review by the directors at the end of the day, 

2. We will be making a PWA, it should be able to work on apple, android and desktops as well: below is the detailed description of how the application would visually look like, along with features and necessary connections and how the wiring would work like and list of what kind of notifications and export details we need. 

3. There will be two roles: Directors: up to only 4 people can be directors 

Employees: there’s no restriction on count of the employees. 

4. The application starts with a basic interface: the logo of the company, below that login-in and a sign-up option  

The sign-up page will ask for the following information: Full Name, date Date of birth, company email, choose role: Director, employee, create 

Password, a security question list- Choose a security question, Security answer (will be used to reset the password of someone forgets), create account button. 

5. User can login using their Full name, or email Id, they can change their password using Full name/ email id and the security question. 

 

Now for the Employees role: 

The application opens with front page having  with a hamburger menu in the top left corner which will have a left side slid effect and the options in it will be: (Calendar, Category, Reports, Profile each page will be explained later), today’s date and day in the top center of the page, a filter button (those three filter lines) in the top right corner having the filters such as category and site, and a vertical long button below it which says: + Add a Task. 

1. As the user clicks the button it opens a pop up which has the following details: 

- i. Name of the task, 

- ii. Description 

- iii. schedule a task with time 

- iv. set alarm option 

- v. a small circular button to make the task priority, if a task is selected as priority it will remain in the top of the list, the user later can edit these details. 

- vi. there will be a select site option which upon clicking will have a drop-down menu to select a site. 

- vii. Then a select category of task it will open a drop down to select a category which a few we will put but they can later add to it (explained further), which will be a compulsory question if it comes to creating a task 

- viii. this pop up will have a small cross button at the top right corner, and a small arrow in a box kinda button in the bottom to save the task, now this panel to write the details of the task, name and points I mentioned above will come up with the keyboard instead of being a separate pop-up, exactly like Microsoft todo has just a bit broader to include our details, so it’s easier to set tasks and not waste time with it. 

- ix. The hamburger and the filter button and the rest of the page remains unaffected as the list of tasks is created, each task will have a small circle to mark it done. Once a task panel is marked done, like in Microsoft to-do it becomes grayish. Like lighter in shade, the user can undo this as well. 

2. The page changes to a new one every day, with the current new date and day at the top and the add task button the filter and menu button again remain unchanged, now if there we’re any incomplete tasks from the previous day they come after the date, and after them comes a thin line and then the “add tasks” button, and the same process of adding multiple tasks as I mentioned above. 

3. The second page from the hamburger menu: The Calendar. 

   - i. On clicking this option from the hamburger menu, the screen opens which has the typical calendar interface. <, Month, year >. 

   - ii. Below that is the calendar of the current month, with proper square separations of each date, the Calander’s dates are clickable to a interface of adding task’s page, it will be connected, every dating starting from the date of joining the application. 

   - iii. The previous months, years or the ones in future, can be accessed using the < and > icon, or clicking the year and month to select so. 

   - iv. User can schedule tasks for whatever future date they please, if a future date has even a single scheduled task it will have a blue line on its top border to represent a task is there. 

   - v. Now, the current date, if the user completes all the tasks of the current date, there will come a small circular button that will turn green, if all tasks completed, 

   - vi. if a couple tasks, even a single one is shifted to the next day, the circle appears as yellow, and only turns green if the task shifted are completed the next day or remains yellow, until they are incomplete. 

   - vii. The complete thing will have all the months calendars up to 2030, and every year end one more year will be added to it. 

4. The next on the hamburger menu will be the Categories. 

      - i. This will open a page which will have a list of all the categories which will be common to all the employees and the directors. It will be the category of the task, as in finance, purchase, delivery, etc. we will add a few very common ones first and the users can further add to it if needed. 

      - ii. In the top right corner will be a button: Add category which will open a small text space and a user will have to write a category, it will have a square with an arrow in it, to save the category. 

      - iii. A user can add to the category list, if a user adds to a category, it will be added for both the employees and the directors. 

      - iv. When any user will create a category it will trigger a push notifications for all the users, directors as well as the employees something like : “Meera created a new category: finance” 

5. The Next from the hamburger menu will be the reports, now these will be the statistical categorization of all the tasks that the user has performed: 

   - i. It will include, no. of task in the categories that user has done, no of sites the user has worked on, 

   - ii. if he clicks on the category part it will open a list of all the categories and on clicking a specific category and the number, it will open to a page which will have a list of sorted tasks that will be organized date wise under that category, and a filter of date in the top right corner. 

   - iii. Similar sorting and statistical data for the sites. It will have list of sites the user has worked on, and the stat number of the tasks done on the sites. On clicking it will open a list of all the tasks sorted date wise with a date filter in the top right corner. 

6. Now the final one from the hamburger menu will be of the Profile. 

   - i. On clicking the Profile option from the menu, a page will open with the user’s details, in the top center will the the common profile image that everyone uses. and below that will be the following details: 

   - ii. Full Name of the user 

   - iii. Email Id of the user 

   - iv. Security question of the user. 

   - v. And a dark mode toggle button, which will make the whole application dark and light mode on users’ choice. 

   - vi. And a log out button. 

Now, the user if once logged in he won’t be logged out until he does so on his own, it will always stay logged in. 

