namespace GlocalCart.API.Helpers
{
    public static class EnvFileLoader
    {
        public static void LoadDefault()
        {
            var candidates = new[]
            {
                Path.Combine(Directory.GetCurrentDirectory(), ".env"),
                Path.Combine(Directory.GetCurrentDirectory(), "GlocalCart (1).API", ".env"),
                Path.Combine(AppContext.BaseDirectory, ".env")
            };

            foreach (var path in candidates.Distinct(StringComparer.OrdinalIgnoreCase))
            {
                Load(path);
            }
        }

        private static void Load(string path)
        {
            if (!File.Exists(path)) return;

            foreach (var rawLine in File.ReadAllLines(path))
            {
                var line = rawLine.Trim();
                if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#")) continue;

                var separatorIndex = line.IndexOf('=');
                if (separatorIndex <= 0) continue;

                var key = line[..separatorIndex].Trim();
                var value = line[(separatorIndex + 1)..].Trim();

                if (value.Length >= 2 &&
                    ((value.StartsWith('"') && value.EndsWith('"')) ||
                     (value.StartsWith('\'') && value.EndsWith('\''))))
                {
                    value = value[1..^1];
                }

                if (string.IsNullOrWhiteSpace(key)) continue;
                if (Environment.GetEnvironmentVariable(key) != null) continue;

                Environment.SetEnvironmentVariable(key, value);
            }
        }
    }
}
