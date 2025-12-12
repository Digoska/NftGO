# How to Add All NFTs to Your Account

There are two ways to add all NFTs from Supabase to your account:

## Option 1: SQL Script (Recommended - Fastest & Most Secure)

### Steps:

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor**

2. **Run the SQL Script**
   - Open `docs/api/ADD_ALL_NFTS_TO_ACCOUNT.sql`
   - Copy the entire contents
   - Paste into SQL Editor
   - Click **Run**

3. **Verify**
   - The script will show you:
     - Your user ID
     - Total NFTs in database
     - How many NFTs you already had
     - How many NFTs were added
     - Your updated stats

### What the Script Does:

- ✅ Uses `auth.uid()` to get your current user ID (secure)
- ✅ Adds all NFTs from `nfts` table to your account
- ✅ Skips NFTs you already have (no duplicates)
- ✅ Automatically updates your stats via database trigger
- ✅ Shows detailed results

### Example Output:

```
✅ Added 25 NFTs to your account
⏭️  Skipped 3 NFTs you already had
📊 Total: 28 NFTs
```

---

## Option 2: TypeScript Function (From App)

### Usage Example:

```typescript
import { addAllNFTsToCurrentAccount } from '../lib/addAllNFTs';
import { useAuth } from '../lib/auth-context';

function MyComponent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AddAllNFTsResult | null>(null);

  const handleAddAllNFTs = async () => {
    if (!user?.id) {
      alert('Please log in first');
      return;
    }

    setLoading(true);
    const result = await addAllNFTsToCurrentAccount(user.id);
    setResult(result);
    setLoading(false);

    if (result.success) {
      alert(`✅ Added ${result.added} NFTs!\n⏭️  Skipped ${result.skipped} you already had`);
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  return (
    <Button onPress={handleAddAllNFTs} disabled={loading}>
      {loading ? 'Adding NFTs...' : 'Add All NFTs to My Account'}
    </Button>
  );
}
```

### Function Details:

**`addAllNFTsToAccount(userId: string)`**
- Fetches all NFTs from database
- Checks which ones you already have
- Adds only missing NFTs
- Returns statistics

**`addAllNFTsToCurrentAccount(userId: string | undefined)`**
- Helper that checks if user is authenticated
- Calls `addAllNFTsToAccount` if user exists

---

## Which Method to Use?

### Use SQL Script (Option 1) if:
- ✅ You want the fastest method
- ✅ You're comfortable with SQL
- ✅ You want to see detailed results
- ✅ You're doing a one-time bulk add

### Use TypeScript Function (Option 2) if:
- ✅ You want to add a button in your app
- ✅ You want to do this programmatically
- ✅ You want to show progress/loading states
- ✅ You're building a feature for users

---

## Notes

- **Stats Update**: Both methods trigger the database function `update_user_stats_on_collect()` automatically
- **No Duplicates**: Both methods skip NFTs you already have
- **Performance**: SQL script is faster for large numbers of NFTs
- **Security**: SQL script uses `auth.uid()` which is more secure (runs as authenticated user)

---

## Troubleshooting

### "User not authenticated"
- Make sure you're logged in to Supabase Dashboard (for SQL script)
- Or make sure `user?.id` exists in your app (for TypeScript)

### "No NFTs found"
- Check that NFTs exist in the `nfts` table
- Run: `SELECT COUNT(*) FROM nfts;` in SQL Editor

### "Foreign key constraint error"
- Make sure your user exists in `auth.users` table
- Make sure NFT IDs are valid UUIDs

