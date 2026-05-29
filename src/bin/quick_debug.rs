use reqwest::Client;

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let url = std::env::var("SUPABASE_URL").unwrap();
    let key = std::env::var("SUPABASE_SERVICE_KEY").unwrap();
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .unwrap();

    let path = "events?select=id,question&limit=2";
    let full_url = format!("{}/rest/v1/{}", url.trim_end_matches('/'), path);
    println!("URL: {full_url}");

    let resp = client
        .get(&full_url)
        .header("apikey", &key)
        .header("Authorization", format!("Bearer {}", &key))
        .send()
        .await
        .unwrap();

    println!("Status: {}", resp.status());
    let text = resp.text().await.unwrap();
    println!("Body[:200]: {}", &text[..text.len().min(200)]);
}
