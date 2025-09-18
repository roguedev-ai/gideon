#!/usr/bin/env python3

import sys
import os

def configure_external_api(external_ip="10.1.10.132", external_port="3000"):
    api_file = "frontend/src/services/api.ts"

    if not os.path.exists(api_file):
        print("❌ Error: {} not found".format(api_file))
        return False

    with open(api_file, 'r') as f:
        content = f.read()

    old_config = 'const API_URL = process.env.REACT_APP_API_URL || "";'
    new_config = 'const API_URL = process.env.REACT_APP_API_URL || "http://{}:{}";'.format(external_ip, external_port)

    if old_config in content:
        content = content.replace(old_config, new_config)
        with open(api_file, 'w') as f:
            f.write(content)

        print("✅ Success! API configuration updated for external access")
        print("📡 API calls will now go to: http://{}:{}".format(external_ip, external_port))
        print("🔄 Frontend container needs to be rebuilt for changes to take effect")
        return True
    else:
        print("⚠️  Warning: API configuration pattern not found. May already be configured.")
        return False

def main():
    print("🚀 Gideon External Access Configuration")
    print("=" * 45)

    external_ip = "10.1.10.132"
    external_port = "3000"

    if len(sys.argv) > 1:
        external_ip = sys.argv[1]
    if len(sys.argv) > 2:
        external_port = sys.argv[2]

    print("Target: {}:{}".format(external_ip, external_port))

    if configure_external_api(external_ip, external_port):
        print()
        print("📋 Next steps:")
        print("1. Rebuild frontend container:")
        print("   docker-compose build --no-cache frontend")
        print("   docker-compose up -d frontend")
        print()
        print("2. Access frontend at:")
        print("   http://{}:{}".format(external_ip, external_port))
        print()
        print("3. Test login - API calls should now work!")
    else:
        print("❌ Configuration failed. Check the errors above.")

if __name__ == "__main__":
    main()
