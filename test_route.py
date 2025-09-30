import requests

url = "https://versailles-three.vercel.app/chat"
url = "http://localhost:3000/api/chat"

data = {
    "question": "On est à Paris avec deux enfants (7 et 10 ans), jamais venus à Versailles. On a une demi-journée un mercredi après-midi et un petit budget. On aimerait surtout être dehors. Que nous conseillez-vous et comment prendre les billets ? réponds de façon courte stp"
}

response = requests.post(url, json=data)

print(f"Status Code: {response.status_code}")
print(f"Headers: {response.headers}")
print(f"Raw Response: {response.text}")
print(f"Response Type: {type(response.text)}")

if response.status_code == 200:
    try:
        print(f"JSON Response: {response.json()}")
    except Exception as e:
        print(f"JSON Error: {e}")
else:
    print(f"Error Response: {response.text}")