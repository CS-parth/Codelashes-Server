#include <stdio.h>
#include <string.h>

#define MAX_LENGTH 1000

void reverse_string(char *str) {
    int length = strlen(str);
    for (int i = 0; i < length / 2; i++) {
        char temp = str[i];
        str[i] = str[length - 1 - i];
        str[length - 1 - i] = temp;
    }
}

int main() {
    int t;
    scanf("%d", &t);
    getchar(); // Consume newline after reading t

    char str[MAX_LENGTH];
    
    while (t--) {
        fgets(str, sizeof(str), stdin);
        
        // Remove newline character if present
        int len = strlen(str);
        if (len > 0 && str[len-1] == '\n') {
            str[len-1] = '\0';
        }
        
        reverse_string(str);
        printf(%s\n", str);
    }
    
    return 0;
}