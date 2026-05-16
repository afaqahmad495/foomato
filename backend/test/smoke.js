process.env.DUMMY_DB = '1';
process.env.DUMMY_STORAGE = '1';
process.env.JWT_SECRET = 'test-secret';

const assert = require('node:assert/strict');

const app = require('../src/app');

function getCookieByName(res, cookieName) {
  const setCookie = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie')] : []);

  const target = `${String(cookieName).toLowerCase()}=`;
  const line = (setCookie || []).find(v => String(v).toLowerCase().startsWith(target));
  if (!line) return null;
  return line.split(';')[0];
}

async function json(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function main() {
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    // AI health check should be available
    {
      const res = await fetch(`${baseUrl}/api/ai/health`, { method: 'GET' });
      const body = await json(res);
      assert.equal(res.status, 200, `ai health: ${JSON.stringify(body)}`);
      assert.equal(body && body.success, true);
      assert.ok(Array.isArray(body.features), 'ai health features should be an array');
    }

    // AI chatbot should respond and persist history (does not require external models)
    {
      const userId = 'smoke-user-1';
      const res = await fetch(`${baseUrl}/api/ai/chatbot/message`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: 'hello', userId }),
      });
      const body = await json(res);
      assert.equal(res.status, 200, `chatbot message: ${JSON.stringify(body)}`);
      assert.equal(body && body.success, true);
      assert.ok(typeof body.botResponse === 'string' && body.botResponse.length > 0, 'botResponse missing');

      const historyRes = await fetch(`${baseUrl}/api/ai/chatbot/history/${userId}`, { method: 'GET' });
      const historyBody = await json(historyRes);
      assert.equal(historyRes.status, 200, `chatbot history: ${JSON.stringify(historyBody)}`);
      assert.equal(historyBody && historyBody.success, true);
      assert.ok(Array.isArray(historyBody.messages), 'chatbot history messages should be an array');
      assert.ok(historyBody.messages.length >= 2, 'chatbot history should have at least 2 messages');
    }

    // unauthenticated access should fail
    {
      const res = await fetch(`${baseUrl}/api/food/get-food-item`, { method: 'GET' });
      assert.equal(res.status, 401);
    }

    // register + login user
    const user = { username: 'u1', email: 'u1@example.com', password: 'Passw0rd!', phone: '123' };
    {
      const res = await fetch(`${baseUrl}/api/auth/user/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(user),
      });
      assert.equal(res.status, 201, `user register: ${JSON.stringify(await json(res))}`);
    }

    let userCookie = null;
    {
      const res = await fetch(`${baseUrl}/api/auth/user/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: user.password }),
      });
      assert.equal(res.status, 200, `user login: ${JSON.stringify(await json(res))}`);
      userCookie = getCookieByName(res, 'user_token');
      assert.ok(userCookie, 'user cookie not set');
    }

    // register + login foodPartner
    const partner = {
      name: 'Pizzeria',
      contactName: 'Owner',
      email: 'p1@example.com',
      password: 'Passw0rd!',
      phone: '555',
      address: 'Somewhere',
    };
    let partnerId = null;
    {
      const res = await fetch(`${baseUrl}/api/auth/foodpartner/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(partner),
      });
      const body = await json(res);
      assert.equal(res.status, 201, `partner register: ${JSON.stringify(body)}`);
      partnerId = body && body.foodPartner && body.foodPartner.id ? String(body.foodPartner.id) : null;
      assert.ok(partnerId, 'partner id missing from register response');
    }

    let partnerCookie = null;
    {
      const res = await fetch(`${baseUrl}/api/auth/foodpartner/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: partner.email, password: partner.password }),
      });
      assert.equal(res.status, 200, `partner login: ${JSON.stringify(await json(res))}`);
      partnerCookie = getCookieByName(res, 'foodpartner_token');
      assert.ok(partnerCookie, 'partner cookie not set');
    }

    // upload partner profile photo
    {
      const form = new FormData();
      form.append('photo', new Blob(['dummy'], { type: 'image/png' }), 'avatar.png');
      const res = await fetch(`${baseUrl}/api/food-partner/profile-photo`, {
        method: 'PATCH',
        headers: { cookie: partnerCookie },
        body: form,
      });
      const body = await json(res);
      assert.equal(res.status, 200, `profile photo: ${JSON.stringify(body)}`);
      assert.ok(body.foodPartner && body.foodPartner.profilePic, 'profilePic missing');
    }

    // create food item
    let foodId = null;
    {
      const form = new FormData();
      form.append('name', 'Pizza');
      form.append('price', '450');
      form.append('description', 'Cheese pizza');
      form.append('video', new Blob(['dummy'], { type: 'video/mp4' }), 'video.mp4');

      const res = await fetch(`${baseUrl}/api/food`, {
        method: 'POST',
        headers: { cookie: partnerCookie },
        body: form,
      });
      const body = await json(res);
      assert.equal(res.status, 201, `create food: ${JSON.stringify(body)}`);
      foodId = body && body.food && body.food._id ? String(body.food._id) : null;
      assert.ok(foodId, 'food id missing from create response');
    }

    // list food items for user (with counts)
    {
      const res = await fetch(`${baseUrl}/api/food/get-food-item`, {
        method: 'GET',
        headers: { cookie: userCookie },
      });
      const body = await json(res);
      assert.equal(res.status, 200, `get food: ${JSON.stringify(body)}`);
      assert.ok(Array.isArray(body.foodItems), 'foodItems should be an array');
      assert.equal(body.foodItems.length, 1);
      assert.equal(String(body.foodItems[0]._id), foodId);
      assert.equal(body.foodItems[0].likesCount, 0);
      assert.equal(body.foodItems[0].savesCount, 0);
      assert.equal(body.foodItems[0].commentsCount, 0);
      assert.equal(body.foodItems[0].price, 450);
    }

    // comments: add + list + count increments
    {
      const res = await fetch(`${baseUrl}/api/comments/${foodId}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userCookie },
        body: JSON.stringify({ text: 'Looks great!' }),
      });
      const body = await json(res);
      assert.equal(res.status, 201, `add comment: ${JSON.stringify(body)}`);
      assert.ok(body.comment && body.comment._id, 'comment _id missing');
      assert.equal(body.comment.text, 'Looks great!');
      assert.equal(body.comment.user.username, 'u1');
    }
    {
      const res = await fetch(`${baseUrl}/api/comments/${foodId}?limit=100&skip=0`, {
        method: 'GET',
        headers: { cookie: userCookie },
      });
      const body = await json(res);
      assert.equal(res.status, 200, `list comments: ${JSON.stringify(body)}`);
      assert.ok(Array.isArray(body.comments));
      assert.equal(body.comments.length, 1);
      assert.equal(body.comments[0].text, 'Looks great!');
      assert.equal(body.comments[0].user.username, 'u1');
    }
    {
      const res = await fetch(`${baseUrl}/api/food/get-food-item`, {
        method: 'GET',
        headers: { cookie: userCookie },
      });
      const body = await json(res);
      assert.equal(res.status, 200, `get food after comment: ${JSON.stringify(body)}`);
      assert.equal(body.foodItems[0].commentsCount, 1);
    }

    // place order (user)
    let order1Id = null;
    let order1PublicId = null;
    {
      const res = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userCookie },
        body: JSON.stringify({
          foodId,
          quantity: 2,
          deliveryMode: 'delivery',
          phone: '03001234567',
          address: { addressLine: 'House 1', cityArea: 'Gulshan', landmark: 'Near park' },
          note: 'No spicy',
          paymentMethod: 'COD',
        }),
      });
      const body = await json(res);
      assert.equal(res.status, 201, `place order: ${JSON.stringify(body)}`);
      assert.ok(body.order && body.order.orderId, 'orderId missing');
      assert.ok(body.order && body.order._id, 'order _id missing');
      order1Id = String(body.order._id);
      order1PublicId = String(body.order.orderId);
      assert.equal(body.order.total, 900);
      assert.equal(body.order.unitPrice, 450);
      assert.equal(String(body.order.foodId), foodId);
      assert.equal(body.order.deliveryMode, 'delivery');
    }

    // list my orders
    {
      const res = await fetch(`${baseUrl}/api/orders/my`, {
        method: 'GET',
        headers: { cookie: userCookie },
      });
      const body = await json(res);
      assert.equal(res.status, 200, `my orders: ${JSON.stringify(body)}`);
      assert.ok(Array.isArray(body.orders));
      assert.equal(body.orders.length, 1);
      assert.equal(body.orders[0].total, 900);
    }

    // cancel my order
    {
      const res = await fetch(`${baseUrl}/api/orders/${order1Id}/cancel`, {
        method: 'PATCH',
        headers: { cookie: userCookie },
      });
      const body = await json(res);
      assert.equal(res.status, 200, `cancel my order: ${JSON.stringify(body)}`);
      assert.equal(body.order.status, 'CANCELLED');
      assert.equal(String(body.order.orderId), order1PublicId);
    }
    // cancel again should fail
    {
      const res = await fetch(`${baseUrl}/api/orders/${order1Id}/cancel`, {
        method: 'PATCH',
        headers: { cookie: userCookie },
      });
      assert.equal(res.status, 400);
    }

    // place another order for partner cancellation
    let order2Id = null;
    {
      const res = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userCookie },
        body: JSON.stringify({
          foodId,
          quantity: 1,
          deliveryMode: 'pickup',
          phone: '03001234567',
          note: 'Ok',
          paymentMethod: 'COD',
        }),
      });
      const body = await json(res);
      assert.equal(res.status, 201, `place order2: ${JSON.stringify(body)}`);
      order2Id = String(body.order._id);
      assert.equal(body.order.status, 'PLACED');
    }

    // partner list orders should include 2
    {
      const res = await fetch(`${baseUrl}/api/orders/partner`, {
        method: 'GET',
        headers: { cookie: partnerCookie },
      });
      const body = await json(res);
      assert.equal(res.status, 200, `partner orders: ${JSON.stringify(body)}`);
      assert.ok(Array.isArray(body.orders));
      assert.equal(body.orders.length, 2);
    }

    // partner cancels order2
    {
      const res = await fetch(`${baseUrl}/api/orders/partner/${order2Id}/cancel`, {
        method: 'PATCH',
        headers: { cookie: partnerCookie },
      });
      const body = await json(res);
      assert.equal(res.status, 200, `partner cancel: ${JSON.stringify(body)}`);
      assert.equal(body.order.status, 'CANCELLED');
      assert.equal(String(body.order._id), order2Id);
    }

    // favourites
    {
      const res = await fetch(`${baseUrl}/api/food/favourite/${foodId}`, {
        method: 'POST',
        headers: { cookie: userCookie },
      });
      assert.equal(res.status, 200, `favourite add: ${JSON.stringify(await json(res))}`);
    }
    {
      const res = await fetch(`${baseUrl}/api/food/favourites`, {
        method: 'GET',
        headers: { cookie: userCookie },
      });
      const body = await json(res);
      assert.equal(res.status, 200, `favourite list: ${JSON.stringify(body)}`);
      assert.ok(body.favourites.includes(foodId));
    }
    {
      const res = await fetch(`${baseUrl}/api/food/favourite/${foodId}`, {
        method: 'DELETE',
        headers: { cookie: userCookie },
      });
      assert.equal(res.status, 200, `favourite remove: ${JSON.stringify(await json(res))}`);
    }

    // save / unsave toggle
    {
      const res = await fetch(`${baseUrl}/api/food/save/${foodId}`, {
        method: 'POST',
        headers: { cookie: userCookie },
      });
      assert.equal(res.status, 200, `save: ${JSON.stringify(await json(res))}`);
    }
    {
      const res = await fetch(`${baseUrl}/api/food/save`, {
        method: 'GET',
        headers: { cookie: userCookie },
      });
      const body = await json(res);
      assert.equal(res.status, 200, `saved list: ${JSON.stringify(body)}`);
      assert.ok(Array.isArray(body.savedFoods));
      assert.equal(body.savedFoods.length, 1);
      assert.equal(String(body.savedFoods[0]._id), foodId);
    }
    {
      const res = await fetch(`${baseUrl}/api/food/save/${foodId}`, {
        method: 'POST',
        headers: { cookie: userCookie },
      });
      const body = await json(res);
      assert.equal(res.status, 200, `unsave: ${JSON.stringify(body)}`);
      assert.equal(body.message, 'Food item unsaved');
    }
    {
      const res = await fetch(`${baseUrl}/api/food/save`, {
        method: 'GET',
        headers: { cookie: userCookie },
      });
      const body = await json(res);
      assert.equal(res.status, 200, `saved list after unsave: ${JSON.stringify(body)}`);
      assert.ok(Array.isArray(body.savedFoods));
      assert.equal(body.savedFoods.length, 0);
    }

    // foodPartner profile
    {
      const res = await fetch(`${baseUrl}/api/food-partner/profile-foodPartner`, {
        method: 'GET',
        headers: { cookie: partnerCookie },
      });
      const body = await json(res);
      assert.equal(res.status, 200, `partner profile: ${JSON.stringify(body)}`);
      assert.ok(body.foodPartner);
      assert.ok(Array.isArray(body.foodPartner.foodItems));
      assert.equal(body.foodPartner.foodItems.length, 1);
      assert.equal(String(body.foodPartner.foodItems[0]._id), foodId);
    }

    // user fetch foodPartner by id
    {
      const res = await fetch(`${baseUrl}/api/food-partner/profile-foodPartner/${partnerId}`, {
        method: 'GET',
        headers: { cookie: userCookie },
      });
      const body = await json(res);
      assert.equal(res.status, 200, `partner by id: ${JSON.stringify(body)}`);
      assert.ok(body.foodPartner);
      assert.equal(String(body.foodPartner._id), partnerId);
    }

    console.log('✅ API smoke test passed (dummy db)');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(err => {
  console.error('❌ API smoke test failed');
  console.error(err);
  process.exitCode = 1;
});
