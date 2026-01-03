document.addEventListener('DOMContentLoaded', () => {
    // 定数と変数
    const DATA_URL = 'https://raw.githubusercontent.com/yzkn/Gemini-JS-AddressConv/refs/heads/main/data/KEN_ALL_ROME.HEADER.UTF8.CSV.json';
    let addressData = []; // 全データを保持

    // DOM要素
    const loadingEl = document.getElementById('loading');
    const appContentEl = document.getElementById('app-content');
    const zipInput = document.getElementById('zip-search');
    const addressSelect = document.getElementById('address-select');
    const houseInput = document.getElementById('house-number');
    const buildingInput = document.getElementById('building-name');
    const resultText = document.getElementById('result-text');
    const copyBtn = document.getElementById('copy-btn');

    // 1. データのロード
    fetch(DATA_URL)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            addressData = data;
            initApp();
        })
        .catch(error => {
            console.error('Error loading data:', error);
            loadingEl.innerHTML = '<p style="color:red;">データの読み込みに失敗しました。<br>ページを再読み込みしてください。</p>';
        });

    // アプリの初期化
    function initApp() {
        loadingEl.classList.add('hidden');
        appContentEl.classList.remove('hidden');

        // イベントリスナーの設定
        zipInput.addEventListener('input', handleZipInput);
        addressSelect.addEventListener('change', updateResult);
        houseInput.addEventListener('input', updateResult);
        buildingInput.addEventListener('input', updateResult);
        copyBtn.addEventListener('click', copyResult);
    }

    // 2. 郵便番号入力時の処理（フィルタリング）
    function handleZipInput(e) {
        const inputVal = e.target.value.replace(/[^0-9]/g, ''); // 数字以外削除

        // 3桁以上入力されたら検索開始（パフォーマンス考慮）
        if (inputVal.length < 3) {
            resetSelect('郵便番号を入力してください');
            return;
        }

        // データを検索 (前方一致)
        const filtered = addressData.filter(item => {
            // 郵便番号は通常1列目(index 0)または'郵便番号'キー
            const zip = item['郵便番号'] || Object.values(item)[0];
            return String(zip).startsWith(inputVal);
        });

        updateSelectOptions(filtered);
    }

    // 3. セレクトメニューの更新
    function updateSelectOptions(items) {
        addressSelect.innerHTML = ''; // クリア

        if (items.length === 0) {
            const option = document.createElement('option');
            option.text = '該当する住所がありません';
            addressSelect.add(option);
            addressSelect.disabled = true;
            return;
        }

        // デフォルトオプション
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.text = `${items.length}件見つかりました - 選択してください`;
        addressSelect.add(defaultOption);

        // 候補を追加
        items.forEach((item) => {
            const option = document.createElement('option');

            // データ取得ロジック
            // 1列目: 郵便番号
            const zip = item['郵便番号'] || Object.values(item)[0];

            // 表示用（日本語）：2〜4列目
            const prefJa = item['都道府県名'] || Object.values(item)[1];
            const cityJa = item['市区町村名'] || Object.values(item)[2];
            const townJa = item['町区域名'] || Object.values(item)[3];

            // データ用（ローマ字）：5〜7列目
            // キー名が不明な場合でも配列インデックスで確実にローマ字を取得
            const prefEn = item['都道府県名ローマ字'] || Object.values(item)[4] || '';
            const cityEn = item['市区町村名ローマ字'] || Object.values(item)[5] || '';
            const townEn = item['町区域名ローマ字'] || Object.values(item)[6] || '';

            // valueには英語(ローマ字)のデータをセット
            option.value = JSON.stringify({
                pref: prefEn,
                city: cityEn,
                town: townEn,
                zip: zip
            });

            // ユーザーが見る選択肢には日本語を表示
            option.text = `〒${zip} ${prefJa} ${cityJa} ${townJa}`;

            addressSelect.add(option);
        });

        addressSelect.disabled = false;
    }

    // 4. 結果の生成と表示
    function updateResult() {
        const selectedValue = addressSelect.value;
        const houseVal = houseInput.value.trim();
        const buildingVal = buildingInput.value.trim();

        if (!selectedValue) {
            resultText.textContent = '住所を選択してください...';
            copyBtn.classList.add('hidden');
            return;
        }

        const addrObj = JSON.parse(selectedValue);

        // ローマ字の大文字小文字修正 (例: SHIBUYA KU -> Shibuya Ku)
        const enPref = toTitleCase(addrObj.pref);
        const enCity = toTitleCase(addrObj.city);
        const enTown = toTitleCase(addrObj.town);

        // "IKANI KEISAI GANAI BAAI" (以下に掲載がない場合) 等の不要な文字列を除去
        let cleanTown = enTown;
        if (cleanTown.toLowerCase().includes('ikani keisai')) {
            cleanTown = '';
        }

        // 住所の組み立て (Building, HouseNo, Town, City, Pref, Zip, Country)
        // 逆順（狭い地域→広い地域）で結合し、最後にJapanを追加
        const parts = [
            buildingVal,   // 建物名
            houseVal,      // 番地
            cleanTown,     // 町域 (ローマ字)
            enCity,        // 市区町村 (ローマ字)
            enPref,        // 都道府県 (ローマ字)
            addrObj.zip,   // 郵便番号
            "Japan"        // 国名 (常に追加)
        ];

        // 空文字を除外してカンマ区切りで結合
        const fullAddress = parts.filter(val => val && val.trim() !== '').join(', ');

        resultText.textContent = fullAddress;
        copyBtn.classList.remove('hidden');
    }

    // ユーティリティ: Title Case 変換 (単語の先頭を大文字、残りを小文字)
    function toTitleCase(str) {
        if (!str) return '';
        // ハイフンやスペースで区切られた単語ごとに処理
        return str.toLowerCase().replace(/(?:^|\s|-)\w/g, function (match) {
            return match.toUpperCase();
        });
    }

    // ユーティリティ: セレクトボックスのリセット
    function resetSelect(msg) {
        addressSelect.innerHTML = '';
        const option = document.createElement('option');
        option.text = msg;
        addressSelect.add(option);
        addressSelect.disabled = true;
    }

    // クリップボードコピー
    function copyResult() {
        const text = resultText.textContent;
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'OK!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        });
    }
});