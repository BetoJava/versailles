import requests

url = "http://localhost:3000/api/chat"

data = {
    "question": "On est à Paris avec deux enfants (7 et 10 ans), jamais venus à Versailles. On a une demi-journée un mercredi après-midi et un petit budget. On aimerait surtout être dehors. Que nous conseillez-vous et comment prendre les billets ?"
}

response = requests.post(url, json=data)

print(response.json())