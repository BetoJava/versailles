import requests

url = "https://versailles-three.vercel.app/api/chat"

data = {
    "message": "On est à Paris avec deux enfants (7 et 10 ans), jamais venus à Versailles. On a une demi-journée un mercredi après-midi et un petit budget. On aimerait surtout être dehors. Que nous conseillez-vous et comment prendre les billets ? réponds de façon courte stp",
    "conversationHistory": []
}

response = requests.post(url, json=data, stream=True)

print(f"Status Code: {response.status_code}")
print(f"Headers: {response.headers}")

if response.status_code == 200:
    print("Streaming response:")
    print("-" * 50)
    
    # Handle streaming response
    for line in response.iter_lines():
        if line:
            line_str = line.decode('utf-8')
            if line_str.startswith('data: '):
                data_content = line_str[6:]  # Remove 'data: ' prefix
                if data_content == '[DONE]':
                    print("\n[Stream ended]")
                    break
                else:
                    try:
                        import json
                        parsed_data = json.loads(data_content)
                        if 'content' in parsed_data:
                            print(parsed_data['content'], end='', flush=True)
                        elif 'error' in parsed_data:
                            print(f"\nError: {parsed_data['error']}")
                    except json.JSONDecodeError:
                        print(f"Could not parse: {data_content}")
    print("\n" + "-" * 50)
else:
    print(f"Request failed with status code: {response.status_code}")
    print(f"Response Text: {response.text}")