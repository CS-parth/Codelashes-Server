#include <stdio.h>
#include <string.h>

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
    while (t--) {
        char a[101];  // Increased size to 101 to accommodate null terminator
        scanf("%s", a);
        reverse_string(a);
        printf("%s\n", a);
    }
    return 0;
}