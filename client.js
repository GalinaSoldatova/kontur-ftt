/** @format */

const { feedback } = require('./fakeBackend/feedbacks');
const { axios } = require('./fakeBackend/mock');

// formatted date from timestamp
const getFormattedDate = date => {
  const currentDate = new Date(date);
  const day = currentDate.getDate();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  return `${year}-${month}-${day}`;
};

// formatted users info
const formattedUsersList = users => {
  return users.reduce((prev, user) => {
    return {
      ...prev,
      [user.id]: `${user.name} (${user.email})`
    };
  }, {});
};

// get users data
const getUsersByFeedbackUsersIds = async feedbackUsersIds => {
  let response;
  try {
    // GET /users -> fake go to api
    response = await axios.get('/users', {
      params: {
        ids: feedbackUsersIds
      }
    });
  } catch (err) {
    return err.response.data;
  }
  return formattedUsersList(response.data?.users);
};

const getFeedbackByProductViewData = async (product, actualize = false) => {
  let response;
  try {
    // GET /feedback -> fake go to api
    response = await axios.get(`/feedback?product=${product}`);
  } catch (err) {
    // added processing in case 404 returns
    // for other status codes, a response from the api will be returned
    if (err.response.status === 404) return { message: 'Такого продукта не существует' };
    return err.response.data;
  }

  const feedbackData = response.data?.feedback;
  // check data -> 2nd case - there are no reviews
  if (feedbackData?.length === 0) return { message: 'Отзывов пока нет' };

  // get all users ids from feedback list
  const allUsersId = feedbackData.map(item => item.userId);

  // get all users
  const users = await getUsersByFeedbackUsersIds(allUsersId);

  // sort feedback data
  const sortFeedbackData = feedbackData.sort((a, b) => b.date - a.date);

  const lastFeedbackUserIds = [];
  const feedback = sortFeedbackData.reduce((prev, item) => {
    if (actualize) {
      // check if the user's review has been encountered
      if (lastFeedbackUserIds.includes(item.userId)) {
        return prev;
      }
      lastFeedbackUserIds.push(item.userId);
    }

    const review = {
      message: item.message,
      date: getFormattedDate(item.date),
      user: users[item.userId]
    };
    return [...prev, review];
  }, []);

  // reverse list of feedback
  feedback.reverse();

  return { feedback };
};

module.exports = { getFeedbackByProductViewData };
